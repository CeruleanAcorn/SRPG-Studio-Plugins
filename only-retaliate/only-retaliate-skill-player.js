/*
only-retaliate-skill-player.js by CeruleanAcorn

Version 1.0: 03/19/2024
	- Initial Public Release

***DEPENDENCY NOTICE***
This plugin needs SkillControl-getPossessionCustomSkillNonWeapon.js active to work!!
***********************

With this plugin, if a weapon has a custom skill with the keyword "onlyRetaliate", 
a player unit cannot use it to initiate an attack on an enemy. If a player unit has the above custom 
skill, they cannot initiate an attack on an enemy with any weapon.

This plugin applies to fusion attack commands as well (i.e the "Capture" fusion command available 
in a fresh SRPG Studio project).

Special thanks to Maple for assistance with finding a particular skill on a weapon in the 
doesItemHaveSpecificCustomSkill function.
*/
(function() {
	
// Derived from Grab_Weapons.js (posted in the SRPG Studio University Discord) by Maple
doesItemHaveSpecificCustomSkill = function (item, customKeyword) {
	skill_list = item.getSkillReferenceList()
    skill_list_length = skill_list.getTypeCount();
	// root.log("Checking skills...");
    for (j = 0; j < skill_list_length; j++) {
		// root.log("Skill: " + (j+1)) ;
        checkedSkill = skill_list.getTypeData(j);
		checkedSkillType = checkedSkill.getSkillType();
		checkedSkillCustomKeyword = checkedSkill.getCustomKeyword();
		// root.log("item is: " + item.getName());
		// root.log("cust is: " + checkedSkillCustomKeyword);
		if(checkedSkillType === SkillType.CUSTOM && checkedSkillCustomKeyword === customKeyword){
			// root.log("Pacifist via weapon!");
			// root.log(checkedSkill.getCustomKeyword());
			return true;
		}
	}
	return false;
};

/* 
AttackChecker.isUnitAttackable runs BEFORE the attack command appears. 
If any weapon is found as valid for attacking, returns true, causing the attack command to appear.
Therefore, this change effectively removes any weapon with IsPacifist == true from being included 
in the isUnitAttackable calculation.
Without this, if the weapon is the only one in the inventory, it can still be used to attack
Therefore allowing the attack command to appear anyway.

The big challenge in this version of only-retaliate is how the unit's skills are checked.
getSkillMixedArray in singleton-skillcontrol is used to get the unit's skills, with an objectFlag variable that determines 
which possible skill sources associated with the unit are checked, using bitwise operators.
It will default to checking for skills from a variety of sources, including the unit's equipped weapon.
Therefore if the unit's equipped weapon has the skill, it can erroneously disallow the attack command entirely until 
the weapon is unequipped. Therefore, we first want to check all skill sources EXCEPT for the unit's weapon.
If the unit has the skill from any said skill sources, then go ahead and disallow the attack command.
Otherwise, then we can check if none of the weapons in the unit's inventory are valid for initiating attacks.
If there is any weapon that IS valid, then the attack command is allowed.

We need to call this function with the hexadecimal value for the unit's equipped weapon set to 0 so that the 
bitwise operation for checking weapons doesn't happen.
*/
var isUnitAttackableAlias = AttackChecker.isUnitAttackable;
AttackChecker.isUnitAttackable = function(unit) {
	var unitCanAttack = isUnitAttackableAlias.call(this, unit);
	
	// If unit cannot already attack based on vanilla implementation attack checking, disregard further checking.
	if(unitCanAttack){
		// Even if there are weapons that do not have the keyword, if the unit possesses the skill, 
		// don't allow checking at all.
		
		// A new function based on SkillControl.getPossessionCustomSkill is used for this plugin.
		var unitSkill = SkillControl.getPossessionCustomSkillNonWeapon(unit, "onlyRetaliate");
		if (unitSkill != null) {
			// root.log("The unit itself has the skill. Preventing Attack command completely.");
			return false;
		}
		
		// root.log("Skill not found on unit, proceeding to weapon check.");
		// Unit does not have the skill without a weapon. Proceed to checking for weapons.
		var i, item, indexArray;		
		var count = UnitItemControl.getPossessionItemCount(unit);
		for (i = 0; i < count; i++) {
			item = UnitItemControl.getItem(unit, i);
			if (item !== null && ItemControl.isWeaponAvailable(unit, item) && this._isWeaponEnabled(item)) { 
				// The idea is that an item is added to indexArray if the unit can attack with it. 
				// By skipping "indexArray = this.getAttackIndexArray(unit, item, true)" 
				// via the continue statement, we do not add the item to the indexArray.
				// root.log("Checking Item: " + item.getName());
				if(doesItemHaveSpecificCustomSkill(item, "onlyRetaliate")){
					// root.log("The item: " + item.getName() + " has the skill. Proceeding to next weapon check.");
					continue;
				}

				// Following declaration and if statement are from vanilla AttackChecker.isUnitAttackable.
				// Checks that the weapon can attack another unit within range.
				indexArray = this.getAttackIndexArray(unit, item, true);
				if (indexArray.length !== 0) {
					// root.log("A weapon without the skill was found. Allowing Attack command");
					return true;
				}
			}
		}
		// root.log("All weapons have the skill. Preventing Attack command completely.");
		return false;
	}
	return unitCanAttack;
};

// Similar to AttackChecker.isAttackable but for Fusion Attacks.
var isFusionAttackableAlias = FusionControl.isAttackable;
// Check if the unit can fuse with targetUnit based on fusionData.
FusionControl.isAttackable = function(unit, targetUnit, fusionData) {
var unitCanFusionAttack = isFusionAttackableAlias.call(this, unit, targetUnit, fusionData);
	if(unitCanFusionAttack){
		var unitSkill = SkillControl.getPossessionCustomSkillNonWeapon(unit, "onlyRetaliate");
		if (unitSkill != null) {
			// root.log("The unit itself has the skill. Preventing Fusion Attack command completely.");
			return false;
		}
		
		// root.log("Skill not found on unit, proceeding to weapon check.");
		var i, item, indexArray;		
		var count = UnitItemControl.getPossessionItemCount(unit);
		for (i = 0; i < count; i++) {
			item = UnitItemControl.getItem(unit, i);
			if (item !== null && ItemControl.isWeaponAvailable(unit, item) && AttackChecker._isWeaponEnabled(item)) { 
				// root.log("Checking Item: " + item.getName());
				if (doesItemHaveSpecificCustomSkill(item, "onlyRetaliate")) {
					// root.log("The item: " + item.getName() + " has the skill. Proceeding to next weapon check.");
					continue;
				}
	
				indexArray = AttackChecker.getAttackIndexArray(unit, item, true);
				if (indexArray.length !== 0) {
					// root.log("A weapon without the skill was found. Allowing Fusion Attack command");
					return true;
				}
			}
		}
		// root.log("All weapons have the skill. Preventing Fusion Attack command completely.");
		return false;
	}
	return unitCanFusionAttack;
};
	
// Disallows a specific weapon from being a selectable item AFTER selecting the attack command.
var isWeaponAllowedAlias = WeaponSelectMenu._isWeaponAllowed;
WeaponSelectMenu._isWeaponAllowed = function(unit, item) {
	var weaponIsAllowed = isWeaponAllowedAlias.call(this, unit, item);
	if(!weaponIsAllowed){
		return weaponIsAllowed;
	}
	if (doesItemHaveSpecificCustomSkill(item, "onlyRetaliate")){
		// root.log("onlyRetaliate on weapon!");
		return false;
	return true;
};

// Similar to WeaponSelectMenu._isWeaponAllowed but for Fusion Attacks.
var isFusionWeaponAllowedAlias = FusionWeaponSelectMenu._isWeaponAllowed;
FusionWeaponSelectMenu._isWeaponAllowed = function(unit, item) {
		var fusionWeaponIsAllowed = isFusionWeaponAllowedAlias.call(this, unit, item);
		if(!fusionWeaponIsAllowed){
			return fusionWeaponIsAllowed;
		}
		if (doesItemHaveSpecificCustomSkill(item, "onlyRetaliate")){
			// root.log("onlyRetaliate on fusion weapon!");
			return false;
		}
	return true;
};

})()