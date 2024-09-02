/*
weakest-link.js by CeruleanAcorn

Version 1.0: 1/13/2022 
	- Initial Public Release 
Version 1.1: 09/02/2024
    - Removed unneeded reference to CompatibleCalculator.getDefense potentially causing plugin clashes.

With this plugin, through a skill with the keyword "weakest-link" the lowest between the two of Defense and Resistance 
is used (after considering parameter bonuses) when calculating the damage an attack will deal, a la the Vajra-Mushti's
Combat Art from Three Houses.
If the stats are equal, the stat attacked will depend on whatever the weapon naturally targets.
HUGE thank you to Maples for their CL_DefSwap.js, an invaluable reference this plugin follows
for using DamageCalculator.calculateDefense.
*/

(function() {
var alias1 = SkillRandomizer.isCustomSkillInvokedInternal;
SkillRandomizer.isCustomSkillInvokedInternal = function(active, passive, skill, keyword) {
	if (keyword === 'weakest-link') {
		return this._isSkillInvokedInternal(active, passive, skill);
	}
	return alias1.call(this, active, passive, skill, keyword);
}

var alias2 = DamageCalculator.calculateDefense;
DamageCalculator.calculateDefense = function(active, passive, weapon, isCritical, totalStatus, trueHitValue) {
	var defensiveStatUsed = alias2.call(this, active, passive, weapon, isCritical, totalStatus, trueHitValue);
	// Case of engine's Weapon Option for NOGUARD, covered in Maples' CL_ DefSwap function so it's covered here too.
	if (this.isNoGuard(active, passive, weapon, isCritical, trueHitValue)) {
		return 0;
	}
	
	var theSkill = SkillControl.getPossessionCustomSkill(active,"weakest-link");
	
	if (theSkill !== null){ // Do not calculate differently if skill is not available
		var def = RealBonus.getDef(passive);
		var res = RealBonus.getMdf(passive);
		if (def > res){ // def higher: calculate with res
			defensiveStatUsed = res;
		} else if (res > def) { // res higher: calculate with def
			defensiveStatUsed = def;
		}
	}
    
	return defensiveStatUsed;
}

})();  
