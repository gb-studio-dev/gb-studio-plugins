const l10n = require("../helpers/l10n").default;

export const id = "EVENT_STREAM_ACTOR_GET_INFO";
export const name = "Streamed Actor Get Info";
export const groups = ["EVENT_GROUP_ACTOR"];
export const subGroups = {
  EVENT_GROUP_ACTOR: "Streaming",
};

export const autoLabel = (fetchArg) => {
  return `Get streaming info of actor ${fetchArg("actorId")}`;
};

export const fields = [
  {
    key: "actorId",
    label: l10n("ACTOR"),
    description: "Actor to query.",
    type: "actor",
    defaultValue: "$self$",
  },
  {
    type: "group",
    fields: [
      {
        key: "streamingVar",
        type: "variable",
        label: "Is streaming",
        description: "Set to 1 while the actor has a live streaming slot.",
        defaultValue: "LAST_VARIABLE",
        width: "50%",
      },
      {
        key: "baseTileVar",
        type: "variable",
        label: "Band base tile",
        description:
          "First sprite VRAM tile of the actor's band. Useful with events that need a base tile index.",
        defaultValue: "LAST_VARIABLE",
        width: "50%",
      },
      {
        key: "bandTilesVar",
        type: "variable",
        label: "Band size",
        description: "Number of tiles the actor's band can hold.",
        defaultValue: "LAST_VARIABLE",
        width: "50%",
      },
    ],
  },
];

export const compile = (input, helpers) => {
  const {
    _callNative,
    _stackPush,
    _stackPushConst,
    _stackPop,
    _addComment,
    _declareLocal,
    _isIndirectVariable,
    _setInd,
    getVariableAlias,
    setActorId,
  } = helpers;

  const aliasStreaming = getVariableAlias(input.streamingVar);
  const aliasBase = getVariableAlias(input.baseTileVar);
  const aliasBand = getVariableAlias(input.bandTilesVar);

  let destStreaming = aliasStreaming;
  let destBase = aliasBase;
  let destBand = aliasBand;
  if (_isIndirectVariable(input.streamingVar))
    destStreaming = _declareLocal("stream_live", 1, true);
  if (_isIndirectVariable(input.baseTileVar))
    destBase = _declareLocal("stream_base", 1, true);
  if (_isIndirectVariable(input.bandTilesVar))
    destBand = _declareLocal("stream_band", 1, true);

  const actorRef = _declareLocal("stream_actor", 1, true);
  setActorId(actorRef, input.actorId);

  _addComment("Streamed Actor Get Info");
  _stackPushConst(destStreaming);
  _stackPushConst(destBase);
  _stackPushConst(destBand);
  _stackPush(actorRef);
  _callNative("vm_stream_actor_get_info");
  _stackPop(4);

  if (_isIndirectVariable(input.streamingVar))
    _setInd(aliasStreaming, destStreaming);
  if (_isIndirectVariable(input.baseTileVar)) _setInd(aliasBase, destBase);
  if (_isIndirectVariable(input.bandTilesVar)) _setInd(aliasBand, destBand);
};
