const l10n = require("../helpers/l10n").default;
export const id = "EVENT_RESERVE_SPRITE_TILES";
export const name = "Reserve sprite tiles";
export const groups = ["EVENT_GROUP_ACTOR"];
export const subGroups = {
  EVENT_GROUP_ACTOR: "EVENT_GROUP_PROPERTIES",
};

export const autoLabel = (fetchArg) => {
  return `Reserve sprite tiles`;
};

export const fields = [
  {
    key: "actorId",
    label: l10n("ACTOR"),
    description: l10n("FIELD_ACTOR_UPDATE_DESC"),
    type: "actor",
    defaultValue: "$self$",
  },
  {
    key: "tile_length",
    label: "length",
    description: "length",
    type: "number",
    width: "50%",
    defaultValue: 1,
  },
];

export const compile = (input, helpers) => {
	const {entity, entityType, scene} = helpers.options;
  let actorId = String(input.actorId);
  if (actorId === "$self$") {
    if (entityType === "actor" && entity) {
      actorId = entity.id;
    } else {
      actorId = "player";
    }
  }  
  
  if (actorId !== "player"){
	const actor = scene.actors.find((s)=>s.id === actorId);
	if (!scene.actors.some((otherActor) => {		
		return (otherActor && otherActor.id !== actor.id && otherActor.spriteSheetId === actor.spriteSheetId && !scene.actorsExclusiveLookup[otherActor.id]);
	})){
		const sprite = scene.sprites.find((s) => s.id === actor.spriteSheetId);
		const index = scene.sprites.indexOf(sprite);
		if (index !== -1) {
			scene.sprites.splice(index, 1);
		}
	}	
  }
  scene.actorsExclusiveLookup[actorId] = input.tile_length;  
};
