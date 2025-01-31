/*
disappear-on-hit.js by CeruleanAcorn

Version 1.0: 01/31/2025
	- Initial Public Release

With this plugin, if a unit has a skill with the custom keyword "disappear-on-hit",
then if they hit a target without defeating them, combat stops and the target is removed from the map. 
This is achieved through programatically triggering the "Remove Unit" Event Command on the hit unit.
Additionally, if a player is hit by an enemy with this skill, the EXP gain window will not be shown.

This plugin is written such that the "Erase" option is used for removing units, but this can be changed
by modifying the value used from the RemoveOption enum in "generator.unitRemove()" (see code below).

No custom parameters are required for this plugin.
*/
(function() {

// Ends the fight when a unit with the skill successfully hits their target without defeating them
// and marks the hit unit for removal.
var alias1 = AttackEvaluator.TotalDamage._isAttackFinish;
AttackEvaluator.TotalDamage._isAttackFinish = function(virtualActive, virtualPassive, attackEntry){
    var attackResult = alias1.call(this, virtualActive, virtualPassive, attackEntry);
    var active = virtualActive.unitSelf;
    var passive = virtualPassive.unitSelf;
    
    // If the attack *could* keep going, see if the skill will stop it.
    if (attackResult == false) {
        var theSkill = SkillControl.getPossessionCustomSkill(active, "disappear-on-hit");
        if (theSkill != null && attackEntry.isHit) {
            attackEntry.stateArrayPassive = [];
            passive.custom.disappearOnHit = true;
            return true;
        }
    }
    
    return attackResult;
}

// Removes the unit after combat.
var alias2 = PreAttack._moveEnd;
PreAttack._moveEnd = function() {
    var attackResult = alias2.call(this);
    var activeUnit = this.getActiveUnit();
    var theSkill = SkillControl.getPossessionCustomSkill(activeUnit, "disappear-on-hit");
    if(theSkill != null){
        if (attackResult == MoveResult.END) {
            var passiveUnit = this.getPassiveUnit();
            if (passiveUnit.custom.disappearOnHit == true) {
                delete passiveUnit.custom.disappearOnHit;
                var generator = root.getEventGenerator();
                // The last parameter in unitRemove(), "RemoveOption.ERASE", determines the type of unit removal.
                // Change to "RemoveOption.DEATH" or "RemoveOption.INJURY" to trigger the corresponding
                // removal instead, as declared in constants-enumeratedtype.js.
                generator.unitRemove(passiveUnit, DirectionType.NULL, RemoveOption.ERASE);
                generator.execute(); 
            }
        }
    }
    
    return attackResult;
}

// QoL to check if EXP needs to be calculated (since a player unit removed wouldn't need it).
var alias3 = NormalAttackOrderBuilder._calculateExperience;
NormalAttackOrderBuilder._calculateExperience = function(virtualActive, virtualPassive){
    var experienceResult = alias3.call(this, virtualActive, virtualPassive);
    
    // If exp gain was already disabled for this battle, don't bother checking further!
    if(experienceResult != -1) {
        // root.log("EXP HAPPENING!");
        var unitSrc = this._attackInfo.unitSrc;
        var unitDest = this._attackInfo.unitDest;
        if(unitSrc.getUnitType() === UnitType.PLAYER){
            if(unitSrc.custom.disappearOnHit == true){
                return -1;
            }
        } else if(unitDest.getUnitType() === UnitType.PLAYER) {
            if(unitDest.custom.disappearOnHit == true){
                return -1;
            }
        }
    }
    
    return experienceResult;
}

}) ();
