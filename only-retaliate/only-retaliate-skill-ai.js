/* 
only-retaliate-skill-ai.js by CeruleanAcorn

Version 1.0: 03/19/2024
	- Initial Public Release

***DEPENDENCY NOTICE***
This plugin needs SkillControl-getPossessionCustomSkillNonWeapon.js active to work!!
***********************

Similar to only-retaliate-skill-player.js, but for affecting non-player units.
Similar to only-retaliate-custom-parameter-ai, but allows this to be implemented with a custom skill instead of a
custom parameter tied to a specific unit or weapon.
This plugin disallows non-player units from initiating an attack either with a particular weapon
if the weapon has a custom skill with the keyword "onlyRetaliate". If the unit has a custom skill with the keyword
"onlyRetaliate", it will not initiate an attack at all. 

If the unit does have a custom skill with the keyword "onlyRetaliate", they can still choose to initiate with weapons 
that do not have said skill, if any.

***NOTE***
"From "Unit Settings", an AI's "Common Pattern Data" -> "Disallowed Action" -> "Use Weapon" appears to achieve the same thing
as assigning the enemy unit with a custom skill that uses this plugin, but dealing with the latter is kept anyways for 
the sake of completeness and instances where it might be convenient to showcase this AI trait via a skill the player can check.

**EXTRA NOTES FOR SCRIPTERS**

There are two options I thought of for handling this. 

1: Alter CombinationCollector.Weapon._isWeaponEnabled to check for onlyRetaliate being set to true
   for either the unit or the weapon when checking if the weapon in question can be considered for use 
   by the AI.
2: Alter CombinationCollector.Weapon.collectCombination, which originally calls 
   CombinationCollector.Weapon._isWeaponEnabled for every weapon in the enemy's inventory anyways, 
   to skip out on checking weapons at all if the unit itself has the custom skill.
   
I feel like option 2 is better in terms of efficiency (so you don't have to waste as much time calling 
CombinationCollector.Weapon._isWeaponEnabled needlessly if the unit has the custom skill).
However, I currently see no return values in collectCombination that would be beneficial to save via an
alias, so my code for that option OVERRIDES the original function without an alias.

So that this plugin is less likely to clash with others, I am leaving option 1 - which uses an alias to
override CombinationCollector.Weapon._isWeaponEnabled - uncommented as the plug and play code by default. 
Option 2 will be commented out for anyone who wants to uncomment and use that instead.

This plugin currently does not address AI using fusion attacks - there seems to be no code in the 
base engine that allows for fusion attacks initiated by the AI.
*/

(function() {
	
// Option 1 - Overrides CombinationCollector.Weapon._isWeaponEnabled with an alias.
var isWeaponEnabledAlias = CombinationCollector.Weapon._isWeaponEnabled;
CombinationCollector.Weapon._isWeaponEnabled = function(unit, item, misc) {
	var unitCanAttack = isWeaponEnabledAlias.call(this, unit, item, misc);	
	if (unitCanAttack == true) {
		if(SkillControl.getPossessionCustomSkillNonWeapon(unit, "onlyRetaliate") != null
			|| doesItemHaveSpecificCustomSkill(item, "onlyRetaliate") == true){
			unitCanAttack = false;
		}
	}
	return unitCanAttack;
};

// Option 2 - Overrides CombinationCollector.Weapon.collectCombination without an alias!!!
// CombinationCollector.Weapon.collectCombination = function(misc) {
	// var i, weapon, filter, rangeMetrics;
	// var unit = misc.unit;
	
	// // Skip checking for weapons entirely if unit has the skill. Otherwise, runs very similarly to the vanilla function.
	// if(SkillControl.getPossessionCustomSkillNonWeapon(unit, "onlyRetaliate") == null){	
	// var itemCount = UnitItemControl.getPossessionItemCount(unit);
		// for (i = 0; i < itemCount; i++) {
			// weapon = UnitItemControl.getItem(unit, i);
			// if (weapon === null) {
				// continue;
			// }
			// // New condition added to check for onlyRetaliate (and deny it from being used to initiate an attack if true).
			// if (!weapon.isWeapon() || !this._isWeaponEnabled(unit, weapon, misc)
				// || doesItemHaveSpecificCustomSkill(weapon, "onlyRetaliate") == true) { 
				// continue;
			// }
			
			// misc.item = weapon;
			
			// rangeMetrics = StructureBuilder.buildRangeMetrics();
			// rangeMetrics.startRange = weapon.getStartRange();
			// rangeMetrics.endRange = weapon.getEndRange();
			
			// filter = this._getWeaponFilter(unit);
			// this._checkSimulator(misc);
			// this._setUnitRangeCombination(misc, filter, rangeMetrics);
		// }
	// }
// };
})()