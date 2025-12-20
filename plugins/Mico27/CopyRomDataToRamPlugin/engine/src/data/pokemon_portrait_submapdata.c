#pragma bank 255

// CustomData pokemon_portrait_submapdata

#include "gbs_types.h"
#include "custom_types.h"
#include "data/pkmn_portraits_1.h"
#include "data/pkmn_portraits_2.h"
#include "data/pkmn_portraits_3.h"
#include "data/pkmn_portraits_4.h"
#include "data/pkmn_portraits_5.h"
#include "data/pkmn_portraits_6.h"
#include "data/pkmn_portraits_7.h"

BANKREF(pokemon_portrait_submapdata)

const submapdata_t pokemon_portrait_submapdata[] = {
	{.x = 0x00, .scene = TO_FAR_PTR_T(pkmn_portraits_1)},
	{.x = 0x07, .scene = TO_FAR_PTR_T(pkmn_portraits_1)},
	{.x = 0x0E, .scene = TO_FAR_PTR_T(pkmn_portraits_1)},
	
	{.x = 0x00, .scene = TO_FAR_PTR_T(pkmn_portraits_2)},
	{.x = 0x07, .scene = TO_FAR_PTR_T(pkmn_portraits_2)},
	{.x = 0x0E, .scene = TO_FAR_PTR_T(pkmn_portraits_2)},
	
	{.x = 0x00, .scene = TO_FAR_PTR_T(pkmn_portraits_3)},
	{.x = 0x07, .scene = TO_FAR_PTR_T(pkmn_portraits_3)},
	{.x = 0x0E, .scene = TO_FAR_PTR_T(pkmn_portraits_3)},
	
	{.x = 0x00, .scene = TO_FAR_PTR_T(pkmn_portraits_4)},
	{.x = 0x07, .scene = TO_FAR_PTR_T(pkmn_portraits_4)},
	{.x = 0x0E, .scene = TO_FAR_PTR_T(pkmn_portraits_4)},
	
	{.x = 0x00, .scene = TO_FAR_PTR_T(pkmn_portraits_5)},
	{.x = 0x07, .scene = TO_FAR_PTR_T(pkmn_portraits_5)},
	{.x = 0x0E, .scene = TO_FAR_PTR_T(pkmn_portraits_5)},
	
	{.x = 0x00, .scene = TO_FAR_PTR_T(pkmn_portraits_6)},
	{.x = 0x07, .scene = TO_FAR_PTR_T(pkmn_portraits_6)},
	{.x = 0x0E, .scene = TO_FAR_PTR_T(pkmn_portraits_6)},
	
	{.x = 0x00, .scene = TO_FAR_PTR_T(pkmn_portraits_7)},
	{.x = 0x07, .scene = TO_FAR_PTR_T(pkmn_portraits_7)}
};
