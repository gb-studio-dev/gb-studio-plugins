const l10n = require("../helpers/l10n").default;

const WAIT_COL_H = 0x01;
const WAIT_COL_V = 0x02;
const WAIT_COL_PIT = 0x04;
const WAIT_COL_ACTOR = 0x08;

export const id = "EVENT_WAIT_FOR_ACTOR_COLLISION";
export const name = "Wait For Actor Collision";
export const groups = ["EVENT_GROUP_ACTOR"];

export const autoLabel = (fetchArg) => {
  return `Wait For Actor Collision : ${fetchArg("actorId")}`;
};

export const fields = [
  {
    key: "actorId",
    label: l10n("ACTOR"),
    description: "Actor to monitor for collision",
    type: "actor",
    defaultValue: "$self$",
  },
  {
    key: "waitHorizontal",
    label: "Horizontal tile collision",
    description: "Wait for wall collision from X movement",
    type: "checkbox",
    defaultValue: true,
  },
  {
    key: "waitVertical",
    label: "Vertical tile collision",
    description: "Wait for floor/ceiling collision from Y movement",
    type: "checkbox",
    defaultValue: true,
  },
  {
    key: "waitPit",
    label: "Pit / ledge collision",
    description: "Wait for ledge-stop collision from X movement",
    type: "checkbox",
    defaultValue: false,
  },
  {
    key: "waitActor",
    label: "Actor collision",
    description: "Wait for collision with another collidable actor",
    type: "checkbox",
    defaultValue: false,
  },
];

export const compile = (input, helpers) => {
  const __engineFieldOn = (key) => {
    const fv =
      helpers.engineFieldValues &&
      helpers.engineFieldValues.find((s) => s.id === key);
    if (fv && fv.value !== undefined && fv.value !== null) return !!fv.value;
    const def = helpers.engineFields && helpers.engineFields[key];
    return def ? !!def.defaultValue : true;
  };
  const __requireEngineField = (key, label) => {
    if (!__engineFieldOn(key)) {
      throw new Error(
        `This event requires the "${label}" engine setting to be enabled (Settings → Engine fields → Dynamic actor).`
      );
    }
  };
  __requireEngineField("DYNAMIC_ACTOR_ENABLE_VM_WAIT_FOR_COLLISION", "VM: Wait for collision");

  const { _declareLocal, setActorId, _stackPush, _stackPushConst, _addComment, _invoke } = helpers;

  const actorRef = _declareLocal("actorRef", 1, true);
  setActorId(actorRef, input.actorId);

  let flags = 0;
  if (input.waitHorizontal) flags |= WAIT_COL_H;
  if (input.waitVertical) flags |= WAIT_COL_V;
  if (input.waitPit) flags |= WAIT_COL_PIT;
  if (input.waitActor) flags |= WAIT_COL_ACTOR;

  _addComment("Wait For Actor Collision");
  _stackPush(actorRef);
  _stackPushConst(flags);  
  _invoke("vm_wait_for_collision", 2, ".ARG1");
};
