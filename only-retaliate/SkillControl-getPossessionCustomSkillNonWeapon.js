/*
SkillControl-getPossessionCustomSkillNonWeapon.js by CeruleanAcorn

Version 1.0: 03/19/2024
	- Initial Public Release

***DEPENDENCY NOTICE***
For only-retaliate-skill-player.js and only-retaliate-skill-ai.js.
Both plugins need this active to work!!
***********************

Custom function for SkillControl derived from SkillControl.getPossessionCustomSkill used to send a different
objectFlag variable while skipping the function chaining of:
getPossessionCustomSkill -> getDirectSkillArray -> getSkillMixArray -> getSkillObjectArray
Basically, relevant work across these is mostly done in this new function, in particular getSkillMixArray's 
declaration of the objectFlag variable determining what skill sources are checked in getSkillObjectArray
to get the final array of unit skills.

Refer to the aforementioned methods, plus the declaration of the ObjectFlag object key, in singleton-skillcontrol.js.
*/
SkillControl.getPossessionCustomSkillNonWeapon = function(unit, keyword){
	/*
	root.log statements show that objectFlag = 11101011.
	In this context each digit in these binary sequences represents something related to the unit that is checked for skills
	to put together the unit's complete array of skills.
	If the digit is 1, that skill source is checked. If it is 0, it not checked.
	The rightmost digit represents the unit's equipped weapon.
	It is left as 0 in this case because of the absence of ObjectFlag.WEAPON, so the unit's equipped weapon isn't checked.
	
	Observe that the objectFlag variable declared in getSkillMixArray named here as defaultObjectFlag = 11101111.
	It appears based on the hexadecimal values in ObjectFlag from singleton-skillcontrol.js, the leftmost 0 that persists in both
	binary sequences represents a SKILL. That appears to not be relevant to this plugin.
	*/
	var objectFlag = ObjectFlag.UNIT | ObjectFlag.CLASS | ObjectFlag.ITEM | ObjectFlag.STATE | ObjectFlag.TERRAIN | ObjectFlag.FUSION;
	// var defaultObjectFlag = ObjectFlag.UNIT | ObjectFlag.CLASS | ObjectFlag.WEAPON | ObjectFlag.ITEM | ObjectFlag.STATE | ObjectFlag.TERRAIN | ObjectFlag.FUSION;
	// root.log("Binary used is: " + objectFlag.toString(2)); // toString(2) prints the number in binary
	// root.log("Default Binary used is: " + defaultObjectFlag.toString(2));
	var arr = this.getSkillObjectArray(unit, ItemControl.getEquippedWeapon(unit), SkillType.CUSTOM, keyword, objectFlag);
	return this._returnSkill(SkillType.CUSTOM, arr);
