/*
spread-penalty.js by CeruleanAcorn

Version 1.0: 1/13/2022 
	- Initial Public Release 

Using this plugin, through a skill with the keyword "spread-penalty" the user's hit rate and damage is affected by specified amounts 
when attacking a unit further than a specified distance. Of note, these changes affect the unit's 
stat(s) BEFORE factoring in their target's own stats. This means that the values that this plugin can change,
as seen by default in the unit menu, are their "Atk" and "Hit", with the final values rounded down.

The custom parameters involved in this skill are as follows:

damagePenalty: The amount to alter the attacker's damage per tile distance exceeding distanceThreshold
hitPenalty: The amount to alter the attacker's hit rate per tile distance exceeding distanceThreshold
distanceThreshold: Max tiles away the attacker can be from the target UNTIL hitPenalty or damagePenalty is then applied on a per-tile basis

By default, damagePenalty: 0.25, hitPenalty: 10, distanceThreshold: 1

There are some important things to note about the custom parameters:
	- All must be a number of some sort.
	- distanceThreshold MUST be a whole number (no negative and decimal numbers)
	- hitPenalty and damagePenalty will be used in their corresponding calculations differently depending on if 
	the value given is a whole number or not. If the value is a whole number, the calculation will treat it as a 
	FLAT change where every tile beyond distanceThreshold adds the custom parameter to the corresponding stat. 
	If the value is a number that is NOT a whole number, the calculation will treat it as a PERCENTAGE change where the actual
	change is the value before the penalty minus the custom parameter multiplied by the number of tiles beyond distanceThreshold.
	For instance, a value of 2 means a -2 stat reduction per exceeded tile, while 0.2 means a -20% stat reduction per exceeded tile. 
	- hitPenalty and damagePenalty, if negative, will INCREASE the corresponding stats instead of lowering them.

Example declaration of custom parameters:
"{damagePenalty: 0.25, hitPenalty: 20, distanceThreshold: 1}"

This means that the penalties will be applied to the attacker when they are attacking from more than 1 tile away.
So at 2 range, their hit is decreased by 20 * (2 - 1) = 20, and their damage is decreased by 0.25 * (2 - 1) = 25%.  

Special thanks to MarkyJoe and Claris, whose Lone Wolf and Redline Slayer/Distance Accuracy plugins, respectively, 
I've adapted from in the making of this plugin.
*/

(function() {
	// Adapted from MarkyJoe's Lone Wolf Plugin.
	// Returns distance between units instead of the number of units within a particular range
	var getDistanceFromTarget = function(active, passive){
		var unitX = active.getMapX();
		var unitY = active.getMapY();
		
		var distanceX = Math.abs(unitX - passive.getMapX());
		var distanceY = Math.abs(unitY - passive.getMapY());
		var totalDistance = distanceX + distanceY;
		return totalDistance;
	}
	
var alias1 = SkillRandomizer.isCustomSkillInvokedInternal;
SkillRandomizer.isCustomSkillInvokedInternal = function(active, passive, skill, keyword) {
	if (keyword === 'spread-penalty') {
		return this._isSkillInvokedInternal(active, passive, skill);
	}
	return alias1.call(this, active, passive, skill, keyword);
};

// Adapted from Claris' Redline Slayer plugin.
var alias2 = DamageCalculator.calculateAttackPower;
DamageCalculator.calculateAttackPower = function(active, passive, weapon, isCritical, totalStatus, trueHitValue) {
	var damage = alias2.call(this, active, passive, weapon, isCritical, totalStatus, trueHitValue);
	var theSkill = SkillControl.getPossessionCustomSkill(active,"spread-penalty");
	if (theSkill != null){
		var damagePenalty = theSkill.custom.damagePenalty != undefined ? theSkill.custom.damagePenalty : 0.25;
		var distanceThreshold = theSkill.custom.distanceThreshold != undefined ? theSkill.custom.distanceThreshold : 1;
		var x = active.getMapX();
		var y = active.getMapY();
		var distance = getDistanceFromTarget(active, passive);

		if(distance > distanceThreshold){
			if(damagePenalty % 1 != 0){ // damagePenalty is NOT a whole number, calculate via percentage.
				damage -= (damage * ((distance - distanceThreshold) * damagePenalty));
			}else{ // damagePenalty IS a whole number, calculate via flat value.
				damage -= ((distance - distanceThreshold) * damagePenalty);
			}
		
			if(damage < 0){
				damage = 0;
			}
		}
	}
	return Math.floor(damage);
};

// Adapted from Claris' Distance Accuracy Plugin.
var alias3 = HitCalculator.calculateSingleHit;
HitCalculator.calculateSingleHit = function(active, passive, weapon, totalStatus) {
	var hitRate = alias3.call(this, active, passive, weapon, totalStatus);
	var theSkill = SkillControl.getPossessionCustomSkill(active,"spread-penalty");
	if (theSkill != null){
		var hitPenalty = theSkill.custom.hitPenalty != undefined ? theSkill.custom.hitPenalty : 10;
		var distanceThreshold = theSkill.custom.distanceThreshold != undefined ? theSkill.custom.distanceThreshold : 1;
		
	if (SkillControl.getPossessionCustomSkill(active,"TrueshotCL") != null){
		return hitRate;
	}
	
	if (weapon.custom.TrueshotCL){
		return hitRate;
	}
	
	var distance = getDistanceFromTarget(active, passive);

	if(distance > distanceThreshold){
		if(hitPenalty % 1 != 0){ // If hitPenalty is NOT a whole number, calculate via percentage.
			hitRate -= (hitRate * ((distance - distanceThreshold) * hitPenalty));
		}else{ // hitPenalty IS a whole number, calculate via flat value.
		hitRate -= ((distance - distanceThreshold) * hitPenalty);
		}
		if(hitRate < 0){
			hitRate = 0;
		}
	}
	}
	return Math.floor(hitRate);
};

}) (); 