/*
shatter-strike.js by CeruleanAcorn

Version 1.0: 09/05/2022
	- Initial Public Release
	
Using this plugin, through a skill with the keyword "shatter-strike" the user's damage will change depending on the 
current remaining durability the weapon has. Of note, these changes affect the unit's 
stat(s) BEFORE factoring in their target's own stats. This means that the value that this plugin can change,
as seen by default in the unit menu, is their "Atk" value, with the final value rounded down.

The custom parameters involved in this skill are as follows:

damageModifier: The boost to the skill holder's damage. If this is negative, the skill holder's damage will DECREASE instead.
activationDurability: The value which will be compared with the equipped weapon's current durability using comparisonOperator.
comparisonOperator: the comparison operator comparing the weapon's durability to the durability custom parameter listed
above. The following valid inputs listed below mean that in order for the skill to activate,
the weapon's current durability must be...:
 '==': ...equal to...
 '>': ...greater than...
 '<':  ...less than...
 '!=': ... not equal to...
 '>=': ...greater than or equal to...
 '<=':  ... less than or equal to...
 
 ...the value for activationDurability!
 
By default, damageModifier: 0.5, activationDurability: 1, comparisonOperator: '=='

Some notes:
	- damageModifier affects the user's damage differently depending on if it is a whole number or not.
	  if the value is a whole number, the calculcation will treat it as a flat change to the user's damage
	  but if the value is a decimal, the calculation will treat it as a percentage change dependent on the user's damage on its own.
	- If comparisonOperator is not any of the inputs outlined above, comparisonOperator defaults to "==".
    	- Observe that if damageModifier is a negative number, the damage will be REDUCED - not increased - accordingly.
	- This plugin does work with weapons which have their uses set to 0 (AKA, it has INFINITE DURABILITY).
	  Note however that enabling game-wide infinite durability through the game options toggle, "Weapon durability is unlimited"
	  found in the engine's Config tab, does not trigger this (the calculation in this plugin uses the set uses value of the weapon
	  which can be seen using the debug comment for viewing the comparison expression).
	  
Example declaration of custom parameters:
"{damageModifier: 2,  activationDurability: 1, comparisonOperator: ">"}"

This means that the user will deal +2 damage if their equipped weapon's durability is greater than 1.

"{damageModifier: 0.25,  activationDurability: 5, comparisonOperator: "<="}"

This means that the user will deal +25% damage if their equipped weapon's durability is less than or equal to 5.

Special thanks to Claris, whose Reline Slayer plugin I've adapted from in the making of this plugin.
*/

// Heavily derived from Claris's Redline Slayer skill plugin.
(function() {
var alias1 = SkillRandomizer.isCustomSkillInvokedInternal;
SkillRandomizer.isCustomSkillInvokedInternal = function(active, passive, skill, keyword) {
	if (keyword === 'shatter-strike') {
		return this._isSkillInvokedInternal(active, passive, skill);
	}
	return alias1.call(this, active, passive, skill, keyword);
}; 

// Have skill show damage boost in combat forecast
var alias2 = DamageCalculator.calculateAttackPower;
DamageCalculator.calculateAttackPower = function(active, passive, weapon, isCritical, totalStatus, trueHitValue) {
	var damage = alias2.call(this, active, passive, weapon, isCritical, totalStatus, trueHitValue);
	var theSkill = SkillControl.getPossessionCustomSkill(active,"shatter-strike");
	
	if (theSkill != null){
		
		var damageModifier = theSkill.custom.damageModifier != undefined ? theSkill.custom.damageModifier : 0.5;
		var durabilityRequired = theSkill.custom.activationDurability != undefined ? theSkill.custom.activationDurability : 1;
		var comparisonOperator = theSkill.custom.comparisonOperator;
	
		// Check for invalid input for comparisonOperator custom parameter. Default to '==' if input is not valid.
		if ((comparisonOperator != '==' && comparisonOperator != '>' && comparisonOperator != '<' && comparisonOperator != '!=' && comparisonOperator != '>=' &&  comparisonOperator != '<=') || comparisonOperator == undefined){
			// Debug - uncomment to see in console if invalid input for comparisonOperator was used.
			//root.log("INVALID");
			comparisonOperator = '==';
		}
	
		var comparisonToEvaluate = "return " + weapon.getLimit() + comparisonOperator + durabilityRequired;		
		// Debug - uncomment to view expression.
		//root.log("Expression is: " + comparisonToEvaluate);
		
		// Call an anonymous function which runs comparisonToEvaluate as a line of code, therefore returning either true or false.
		var result = Function(comparisonToEvaluate)();
		// Debug -  Uncomment to verify that the expression is correct/evaluated correctly in the console.
		//root.log("Result is: " + result);
		if(result == true){
			var boost = 0;
		
			if(damageModifier % 1 != 0){ // damageModifier is NOT a whole number, calculate via percentage
				boost = Math.floor(damage*damageModifier);
				return Math.floor(damage + boost);
			}else{ // damageModifier IS a whole number, calculate via flat value.
				return Math.floor(damage + damageModifier);
			}
		}
	}
	return Math.floor(damage);
};

}) (); 
