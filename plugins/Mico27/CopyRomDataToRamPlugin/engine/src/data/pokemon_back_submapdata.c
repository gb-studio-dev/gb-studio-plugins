#pragma bank 255

// CustomData pokemon_back_submapdata

#include "gbs_types.h"
#include "custom_types.h"
#include "data/pkmn_backs_1.h"
#include "data/pkmn_backs_2.h"
#include "data/pkmn_backs_3.h"
#include "data/pkmn_backs_4.h"
#include "data/pkmn_backs_5.h"
#include "data/pkmn_backs_6.h"
#include "data/pkmn_backs_7.h"

BANKREF(pokemon_back_submapdata)

const submapdata_t pokemon_back_submapdata[] = {
	{.x = 0x00, .scene = TO_FAR_PTR_T(pkmn_backs_1)},
	{.x = 0x06, .scene = TO_FAR_PTR_T(pkmn_backs_1)},
	{.x = 0x0C, .scene = TO_FAR_PTR_T(pkmn_backs_1)},
	
	{.x = 0x00, .scene = TO_FAR_PTR_T(pkmn_backs_2)},
	{.x = 0x06, .scene = TO_FAR_PTR_T(pkmn_backs_2)},
	{.x = 0x0C, .scene = TO_FAR_PTR_T(pkmn_backs_2)},
	
	{.x = 0x00, .scene = TO_FAR_PTR_T(pkmn_backs_3)},
	{.x = 0x06, .scene = TO_FAR_PTR_T(pkmn_backs_3)},
	{.x = 0x0C, .scene = TO_FAR_PTR_T(pkmn_backs_3)},
	
	{.x = 0x00, .scene = TO_FAR_PTR_T(pkmn_backs_4)},
	{.x = 0x06, .scene = TO_FAR_PTR_T(pkmn_backs_4)},
	{.x = 0x0C, .scene = TO_FAR_PTR_T(pkmn_backs_4)},
	
	{.x = 0x00, .scene = TO_FAR_PTR_T(pkmn_backs_5)},
	{.x = 0x06, .scene = TO_FAR_PTR_T(pkmn_backs_5)},
	{.x = 0x0C, .scene = TO_FAR_PTR_T(pkmn_backs_5)},
	
	{.x = 0x00, .scene = TO_FAR_PTR_T(pkmn_backs_6)},
	{.x = 0x06, .scene = TO_FAR_PTR_T(pkmn_backs_6)},
	{.x = 0x0C, .scene = TO_FAR_PTR_T(pkmn_backs_6)},
	
	{.x = 0x00, .scene = TO_FAR_PTR_T(pkmn_backs_7)},
	{.x = 0x06, .scene = TO_FAR_PTR_T(pkmn_backs_7)}
};
