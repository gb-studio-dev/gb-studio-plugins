#ifndef THREAD_EX_H
#define THREAD_EX_H

#include <gbdk/platform.h>

#include "data/states_defines.h"
#include "vm.h"

// Bit reserved in SCRIPT_CTX.flags to mark a context paused by this plugin.
// The stock VM only ever clears SCRIPT_CTX.flags (script_execute), so the bit
// is free and is automatically dropped when a context is recycled.
#define THREAD_EX_CTX_PAUSED 0x80

#ifdef THREAD_EX_ENABLE_THREAD_STATE
// Thread states reported by vm_thread_get_state
#define THREAD_EX_STATE_TERMINATED 0
#define THREAD_EX_STATE_RUNNING    1
#define THREAD_EX_STATE_PAUSED     2

// args (push order): dest, threadHandle
void vm_thread_get_state(SCRIPT_CTX * THIS) OLDCALL BANKED;
#endif

#ifdef THREAD_EX_ENABLE_THREAD_COUNT
// args (push order): dest
void vm_thread_count(SCRIPT_CTX * THIS) OLDCALL BANKED;
#endif

#ifdef THREAD_EX_ENABLE_THREAD_PAUSE
// args (push order): stubBank, stubPtr, threadHandle
void vm_thread_pause(SCRIPT_CTX * THIS) OLDCALL BANKED;
// args (push order): threadHandle
void vm_thread_resume(SCRIPT_CTX * THIS) OLDCALL BANKED;
#endif

#ifdef THREAD_EX_ENABLE_ACTOR_UPDATE_PAUSE
// args (push order): stubBank, stubPtr, actorIndex
void vm_actor_update_script_pause(SCRIPT_CTX * THIS) OLDCALL BANKED;
// args (push order): actorIndex
void vm_actor_update_script_resume(SCRIPT_CTX * THIS) OLDCALL BANKED;
#endif

#endif
