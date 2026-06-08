#ifndef SCENE_STACK_EX_H
#define SCENE_STACK_EX_H

#define MAX_SCENE_STACK_EX_COUNT 2

extern UBYTE vm_pop_scene_stack_state;

void scene_stack_init(void) BANKED;
void push_scene_stack_ex(void) BANKED;
UBYTE pop_scene_stack_ex(void) BANKED;

#endif