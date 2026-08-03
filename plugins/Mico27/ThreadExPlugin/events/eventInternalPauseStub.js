// Internal event - not meant to be added by hand.
//
// Compiled into a tiny standalone script whose only job is to spin in a
// waitable state:
//
//     loop:  VM_IDLE
//            VM_JUMP loop
//
// Pausing a thread swaps its PC/bank for this stub, so the context stays in
// the VM runner's list, costs about one instruction per frame, and never
// touches its own VM stack - which is what makes a paused thread resumable
// even when it was stopped in the middle of a "wait N frames".
export const id = "EVENT_THREAD_EX_INTERNAL_PAUSE_STUB";
export const name = "Thread Ex: Pause Stub (internal)";
export const groups = ["EVENT_GROUP_CONTROL_FLOW", "EVENT_GROUP_MISC"];
export const deprecated = true;

export const fields = [];

export const compile = (input, helpers) => {
  const { _label, _jump, _addCmd, getNextLabel } = helpers;
  const loopLabel = getNextLabel();
  _label(loopLabel);
  _addCmd("VM_IDLE");
  _jump(loopLabel);
};
