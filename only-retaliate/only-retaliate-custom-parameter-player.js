/*
only-retaliate-custom-parameter-player.js

With this plugin, if a weapon has a custom parameter with the keyword "onlyRetaliate" set to true, 
a player unit cannot use it to initiate an attack on an enemy. If a player unit has the above custom 
parameter, they cannot initiate an attack on an enemy with any weapon.

This plugin applies to fusion attack commands as well (i.e the "Capture" fusion command available 
in a fresh SRPG Studio project).

Custom parameter declaration:
{onlyRetaliate: true}
*/
(function() {

// Disallows weapons with onlyRetaliate set to true from being a selectable item after 
// selecting the attack command. The reason WeaponSelectMenu._isWeaponAllowed is used instead 
// of ItemControl.isWeaponAvailable is because the former is relevant only when selecting a weapon 
// to attack with while the latter is applied to simply equipping the item from the unit's inventory.
var isWeaponAllowedAlias = WeaponSelectMenu._isWeaponAllowed;
WeaponSelectMenu._isWeaponAllowed = function(unit, item) {
	var weaponIsAllowed = isWeaponAllowedAlias.call(this, unit, item);
	if(weaponIsAllowed == true){
		weaponIsAllowed = item.custom.onlyRetaliate == true ? false : true;
		// root.log("onlyRetaliate declared as: " + item.custom.onlyRetaliate);
		// root.log("So, weaponIsAllowed is: " + weaponIsAllowed);
	}
	return weaponIsAllowed;
};

// Disallows weapons with onlyRetaliate set to true being a selectable item after selecting a 
// fusion attack command (i.e default "Capture" command).
var isFusionWeaponAllowedAlias = FusionWeaponSelectMenu._isWeaponAllowed;
FusionWeaponSelectMenu._isWeaponAllowed = function(unit, item) {
	var fusionWeaponIsAllowed = isFusionWeaponAllowedAlias.call(this, unit, item);
	if(fusionWeaponIsAllowed == true){
		fusionWeaponIsAllowed = item.custom.onlyRetaliate == true ? false : true;
		// root.log("onlyRetaliate declared as: " + item.custom.onlyRetaliate);
		// root.log("So, fusionWeaponIsAllowed is: " + fusionWeaponIsAllowed);
	}
	return fusionWeaponIsAllowed;
};

// If any weapon is found as valid for attacking, returns true.
// Therefore, this change effectively removes any weapon with onlyRetaliate set to true from being included 
// in the isUnitAttackable calculation, therefore disallowing the attack command to appear in the first place
// if no valid weapons are found due to onlyRetaliate.
var isUnitAttackableAlias = AttackChecker.isUnitAttackable;
AttackChecker.isUnitAttackable = function(unit) {
	var unitCanAttack = isUnitAttackableAlias.call(this, unit);
	var i, item, indexArray;
	var count = UnitItemControl.getPossessionItemCount(unit);
	
	if(unit.custom.onlyRetaliate == true) {
		// root.log("Unit onlyRetaliate is true, attack command not displayable.");
		unitCanAttack = false;
	} else if (unitCanAttack == true) {
		unitCanAttack = false;
		for (i = 0; i < count; i++) {
			item = UnitItemControl.getItem(unit, i);
			if (item !== null && ItemControl.isWeaponAvailable(unit, item) && item.custom.onlyRetaliate != true) {
				indexArray = this.getAttackIndexArray(unit, item, true);
				if (indexArray.length !== 0) {
					// root.log("Valid attacking weapon found, attack command displayable.");
					return true;
				}
			}
		}
	}
	return unitCanAttack;
};

// Same as AttackChecker.isUnitAttackable but for fusion attacks.
var isAttackableAlias = FusionControl.isAttackable;
FusionControl.isAttackable = function(unit, targetUnit, fusionData){
	var unitCanAttack = isAttackableAlias.call(this, unit, targetUnit, fusionData);	
	if(unit.custom.onlyRetaliate == true){
		// root.log("Unit onlyRetaliate is true, fusion attack command not displayable.");
		unitCanAttack = false;
	}
	return unitCanAttack;
};
})()