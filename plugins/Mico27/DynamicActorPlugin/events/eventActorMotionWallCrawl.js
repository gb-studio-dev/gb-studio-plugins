const l10n = require("../helpers/l10n").default;

export const id = "EVENT_ACTOR_MOTION_WALL_CRAWL";
export const name = "Actor Motion: Wall Crawl";
export const groups = ["EVENT_GROUP_ACTOR"];

export const autoLabel = (fetchArg, input) => {
  return `Wall Crawl : ${fetchArg("actorId")}`;
};

export const fields = [
  {
    key: "actorId",
    label: l10n("ACTOR"),
    description:
      "Actor that crawls along walls/ceilings/floors, wrapping around corners (Zelda Spark style). Needs a behavior with Move X + Move Y and tile collision OFF — the crawl logic is what follows the walls. Runs forever; a wall is a fully solid tile (map borders count as wall).",
    type: "actor",
    defaultValue: "$self$",
  },
  {
    key: "wallSide",
    label: "Wall side",
    description:
      "Which hand stays on the wall. Right hand = travels clockwise around solid blocks; left hand = counter-clockwise.",
    type: "select",
    options: [
      ["right", "Right hand (clockwise)"],
      ["left", "Left hand (counter-clockwise)"],
    ],
    defaultValue: "right",
  },
  {
    key: "startDirection",
    label: "Start direction",
    description:
      "Initial crawl direction. If it's blocked or has no wall beside it, the crawler turns on the first step automatically.",
    type: "select",
    options: [
      ["right", "Right"],
      ["left", "Left"],
      ["up", "Up"],
      ["down", "Down"],
    ],
    defaultValue: "right",
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
  __requireEngineField("DYNAMIC_ACTOR_ENABLE_VM_MOTION_CRAWL_STEP", "VM motion: Crawl step");
  __requireEngineField("DYNAMIC_ACTOR_ENABLE_MOVE_X", "Component: Move horizontally");
  __requireEngineField("DYNAMIC_ACTOR_ENABLE_MOVE_Y", "Component: Move vertically");

  const {
    _invoke,
    _stackPush,
    _stackPushConst,
    _addComment,
    _declareLocal,
    setActorId,
  } = helpers;

  const side = input.wallSide === "left" ? 1 : 0;
  const dirValues = { up: 0, right: 1, down: 2, left: 3 };
  const startDir =
    dirValues[input.startDirection] !== undefined
      ? dirValues[input.startDirection]
      : 1;

  const actorRef = _declareLocal("tmp0", 1, true);

  setActorId(actorRef, input.actorId);

  _addComment(`Actor Motion: Wall Crawl (${side ? "left" : "right"} hand)`);

  _stackPush(actorRef);
  _stackPushConst(startDir);
  _stackPushConst(side);
  _stackPushConst(0);
  _stackPushConst(0);
  _invoke("vm_actor_crawl_step", 5, ".ARG4");
};
