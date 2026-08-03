#pragma bank 255

// Thread Ex Plugin
//
// Freezes a VM thread where it stands and later continues it from that exact
// instruction. Pausing swaps the context's PC/bank for a tiny "VM_IDLE /
// VM_JUMP self" stub compiled by the event, so the context stays in the VM
// runner's list and nothing about thread scheduling has to be touched. The
// resume point is saved above the thread's own VM stack pointer, which costs no
// RAM and is released automatically if the thread is terminated or the scene
// changes.
//
// Every feature is behind its own engine setting; with all of them unchecked
// this module compiles to nothing. It only reads/writes existing stock engine
// state, it does not replace any stock engine file.

#include "thread_ex.h"

#include "actor.h"
#include "vm.h"

#if defined(THREAD_EX_ENABLE_THREAD_PAUSE) || defined(THREAD_EX_ENABLE_ACTOR_UPDATE_PAUSE)
    #define THREAD_EX_NEEDS_PAUSE_HELPERS
#endif

#if defined(THREAD_EX_NEEDS_PAUSE_HELPERS) || defined(THREAD_EX_ENABLE_THREAD_STATE)
    #define THREAD_EX_NEEDS_CTX_LOOKUP
#endif

#ifdef THREAD_EX_NEEDS_CTX_LOOKUP
static SCRIPT_CTX * ctx_by_id(UBYTE id) {
    SCRIPT_CTX * ctx = first_ctx;
    while (ctx) {
        if (ctx->ID == id) return ctx;
        ctx = ctx->next;
    }
    return NULL;
}
#endif

#ifdef THREAD_EX_NEEDS_PAUSE_HELPERS

// Slot [0] is deliberately skipped: VM_INVOKE handlers such as wait_frames keep
// their counter one word ahead of the stack pointer without reserving it, so
// writing there would break a thread paused in the middle of a wait.
static void pause_ctx(SCRIPT_CTX * ctx, UBYTE bank, const UBYTE * pc) {
    if (ctx == NULL) return;
    if (ctx->flags & THREAD_EX_CTX_PAUSED) return;
    // A locked thread never yields to the runner, pausing it would freeze the
    // whole VM with no way to resume it.
    if (ctx->lock_count) return;

    ctx->stack_ptr[1] = (UWORD)ctx->PC;
    ctx->stack_ptr[2] = ctx->bank;
    ctx->stack_ptr += 3;
    ctx->flags |= THREAD_EX_CTX_PAUSED;
    ctx->PC = pc;
    ctx->bank = bank;
}

static void resume_ctx(SCRIPT_CTX * ctx) {
    if (ctx == NULL) return;
    if (!(ctx->flags & THREAD_EX_CTX_PAUSED)) return;

    ctx->stack_ptr -= 3;
    ctx->PC = (const UBYTE *)ctx->stack_ptr[1];
    ctx->bank = (UBYTE)ctx->stack_ptr[2];
    ctx->flags &= ~THREAD_EX_CTX_PAUSED;
}

#endif // THREAD_EX_NEEDS_PAUSE_HELPERS

#ifdef THREAD_EX_ENABLE_THREAD_STATE

// args (push order): dest, threadHandle
//
// A handle whose context can no longer be found reports "terminated": that
// covers a thread that ran to completion, one killed by Thread Stop, one lost
// to a scene change, and a handle variable that was never assigned a thread.
void vm_thread_get_state(SCRIPT_CTX * THIS) OLDCALL BANKED {
    INT16 dest_idx = *(INT16 *)VM_REF_TO_PTR(FN_ARG1);
    UWORD handle   = *(UWORD *)VM_REF_TO_PTR(FN_ARG0);
    SCRIPT_CTX * ctx;
    INT16 state = THREAD_EX_STATE_TERMINATED;
    INT16 * A;

    if (!(handle & SCRIPT_TERMINATED)) {
        ctx = ctx_by_id((UBYTE)handle);
        if (ctx != NULL) {
            state = (ctx->flags & THREAD_EX_CTX_PAUSED)
                ? THREAD_EX_STATE_PAUSED
                : THREAD_EX_STATE_RUNNING;
        }
    }

    // The destination index was pushed before the handle, so it is relative to
    // the stack pointer as it was before both arguments went on.
    if (dest_idx < 0) {
        A = (INT16 *)(THIS->stack_ptr + dest_idx - 2);
    } else {
        A = (INT16 *)(script_memory + dest_idx);
    }
    *A = state;
}

#endif // THREAD_EX_ENABLE_THREAD_STATE

#ifdef THREAD_EX_ENABLE_THREAD_COUNT

// args (push order): dest
//
// Number of VM contexts currently allocated out of VM_MAX_CONTEXTS - the length
// of the runner's active list. Paused threads are counted: they keep their
// context. So is the script calling this, since it is running.
void vm_thread_count(SCRIPT_CTX * THIS) OLDCALL BANKED {
    INT16 dest_idx = *(INT16 *)VM_REF_TO_PTR(FN_ARG0);
    SCRIPT_CTX * ctx = first_ctx;
    UBYTE count = 0;
    INT16 * A;

    while (ctx) {
        count++;
        ctx = ctx->next;
    }

    if (dest_idx < 0) {
        A = (INT16 *)(THIS->stack_ptr + dest_idx - 1);
    } else {
        A = (INT16 *)(script_memory + dest_idx);
    }
    *A = count;
}

#endif // THREAD_EX_ENABLE_THREAD_COUNT

#ifdef THREAD_EX_ENABLE_THREAD_PAUSE

// args (push order): stubBank, stubPtr, threadHandle
void vm_thread_pause(SCRIPT_CTX * THIS) OLDCALL BANKED {
    UBYTE bank       = (UBYTE)*(UWORD *)VM_REF_TO_PTR(FN_ARG2);
    const UBYTE * pc = (const UBYTE *)*(UWORD *)VM_REF_TO_PTR(FN_ARG1);
    UWORD handle     = *(UWORD *)VM_REF_TO_PTR(FN_ARG0);
    (void)THIS;

    if (handle & SCRIPT_TERMINATED) return;
    pause_ctx(ctx_by_id((UBYTE)handle), bank, pc);
}

// args (push order): threadHandle
void vm_thread_resume(SCRIPT_CTX * THIS) OLDCALL BANKED {
    UWORD handle = *(UWORD *)VM_REF_TO_PTR(FN_ARG0);
    (void)THIS;

    if (handle & SCRIPT_TERMINATED) return;
    resume_ctx(ctx_by_id((UBYTE)handle));
}

#endif // THREAD_EX_ENABLE_THREAD_PAUSE

#ifdef THREAD_EX_ENABLE_ACTOR_UPDATE_PAUSE

// args (push order): stubBank, stubPtr, actorIndex
void vm_actor_update_script_pause(SCRIPT_CTX * THIS) OLDCALL BANKED {
    UBYTE bank       = (UBYTE)*(UWORD *)VM_REF_TO_PTR(FN_ARG2);
    const UBYTE * pc = (const UBYTE *)*(UWORD *)VM_REF_TO_PTR(FN_ARG1);
    UBYTE i          = *(UBYTE *)VM_REF_TO_PTR(FN_ARG0);
    UWORD handle;
    (void)THIS;

    if (i >= MAX_ACTORS) return;
    handle = actors[i].hscript_update;
    if (handle & SCRIPT_TERMINATED) return;
    pause_ctx(ctx_by_id((UBYTE)handle), bank, pc);
}

// args (push order): actorIndex
void vm_actor_update_script_resume(SCRIPT_CTX * THIS) OLDCALL BANKED {
    UBYTE i = *(UBYTE *)VM_REF_TO_PTR(FN_ARG0);
    UWORD handle;
    (void)THIS;

    if (i >= MAX_ACTORS) return;
    handle = actors[i].hscript_update;
    if (handle & SCRIPT_TERMINATED) return;
    resume_ctx(ctx_by_id((UBYTE)handle));
}

#endif // THREAD_EX_ENABLE_ACTOR_UPDATE_PAUSE
