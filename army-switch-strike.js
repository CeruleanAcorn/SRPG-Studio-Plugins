/*
army-switch-strike.js by CeruleanAcorn

Version 1.0: 07/13/2025
	- Initial Public Release
Version 1.1: 08/10/2025
    - A Player unit can now switch to an Enemy unit with this skill.
    - Units can be prevented from switching allegiances if they have the 
      custom parameter "denySwitch" set to true.

With this plugin, if a unit has a skill with the custom keyword "army-switch-strike",
then a successful attack on an opposing target can immediately end combat and switch the allegiance of the target.
If the skill owner is:
    - A PLAYER, and the target is an ENEMY, the target becomes an ALLY.
    - An ENEMY, and the target is a PLAYER or ALLY, the target becomes an ENEMY.
    - An ALLY, and the target is an ENEMY, the target becomes an ALLY.

An allegiance switch can be prevented if a unit that would otherwise do so has the 
custom parameter "denySwitch" set to true.

This plugin defines a new "enum" called "ArmySwitch" and function called "whichArmySwitch()".
*/

(function() {

var ArmySwitch = {
    NOSWITCH: 0,
    ENEMYTOALLY: 1,
    ALLYTOENEMY: 2,
    PLAYERTOENEMY: 3
};

whichArmySwitch = function(active, passive) {
    //root.log(active.getUnitType() + "  is the active unit's UnitType");
    //root.log(passive.getUnitType() + " is the passive unit's UnitType");
    if(!passive.custom.denySwitch){
        if ((active.getUnitType() == UnitType.PLAYER || active.getUnitType() == UnitType.ALLY) 
            && passive.getUnitType() == UnitType.ENEMY) {
            //root.log("ENEMY TO ALLY!");
            return ArmySwitch.ENEMYTOALLY;
        } else if (active.getUnitType() == UnitType.ENEMY && passive.getUnitType() == UnitType.ALLY) {
            //root.log("ALLY TO ENEMY!");
            return ArmySwitch.ALLYTOENEMY;
        } else if (passive.getUnitType() == UnitType.PLAYER) {
            //root.log("PLAYER TO ENEMY!");
            return ArmySwitch.PLAYERTOENEMY;
        }
    } else {
        root.log("DENIED");
    }
    //root.log("NO SWITCH!");
    return ArmySwitch.NOSWITCH;
}

/*
This function normally checks if a fight should end after an attack sequence.
Because this function is called for the end of every attack sequence,
this function will be used to mark if a unit should be switch allegiances or not.
This function is also modified to end the fight when a unit with the skill in question
successfully hits their target.
*/
var alias1 = AttackEvaluator.TotalDamage._isAttackFinish;
AttackEvaluator.TotalDamage._isAttackFinish = function(virtualActive, virtualPassive, attackEntry) {
    var result = alias1.call(this, virtualActive, virtualPassive, attackEntry);
    var active = virtualActive.unitSelf;
    var passive = virtualPassive.unitSelf;
    //root.log("The attacker's name is: " + active.getName());
    
    // If the attack *could* keep going, see if the skill will stop it.
    if (result == false) {
        var theSkill = SkillControl.getPossessionCustomSkill(active, "army-switch-strike");
        if (theSkill != null && attackEntry.isHit) {
            if (whichArmySwitch(active, passive) != ArmySwitch.NOSWITCH) {
                //root.log(passive.getName() + " Will switch armies!");
                attackEntry.stateArrayPassive = [];
                passive.custom.becomeAlly = true;
                return true;
            }
        }
    }
    return result;
}

/*
Handles situations when an AI unit switches sides when it is NOT their phase.

Looks like doEndAction() is called when attacking skipping is triggered; it is called during 
PreAttack_completeMemberData, if _skipAttack() is true.

Curiously, if we try to change the allegiance of an AI unit on its own turn in this function, the game crashes;
that will instead by handled in EnemyTurn._isOrderAllowed().
*/
var alias2 = PreAttack._doEndAction;
PreAttack._doEndAction = function() {
    // Seems like it's okay to call this function before doing this plugin's extra code
    // Because it doesn't have a return value we don't have to store the result in anything.
    alias2.call(this);
    
    var passive = this.getPassiveUnit();
    // Original function checks if passive.getHp() === 0. Coding the false condition 
    // allows this to run only if the targeted unit is still alive.
    if (passive.getHp() !== 0) {
        if (passive.custom.becomeAlly){
            // The target might have the becomeAlly custom parameter,
            // but we need to only trigger the allegiance change in scenarios
            // where it isn't the AI unit's own phase.
            if (passive.getUnitType() == UnitType.ENEMY 
                && (root.getCurrentSession().getTurnType() == TurnType.PLAYER 
                || root.getCurrentSession().getTurnType() == TurnType.ALLY)) {
                // Without this delete, AI units would switch back allegiances
                // during EnemyTurn._isOrderAllowed().
                delete passive.custom.becomeAlly;
                var generator = root.getEventGenerator();
                generator.unitAssign(passive, UnitType.ALLY);
                generator.execute();
            } else if (passive.getUnitType() == UnitType.ALLY
            && root.getCurrentSession().getTurnType() == TurnType.ENEMY) {
                delete passive.custom.becomeAlly;
                var generator = root.getEventGenerator();
                generator.unitAssign(passive, UnitType.ENEMY);
                generator.execute();
            } else if(passive.getUnitType() == UnitType.PLAYER) {
                delete passive.custom.becomeAlly;
                var generator = root.getEventGenerator();
                generator.unitAssign(passive, UnitType.ENEMY);
                generator.execute();
            }
        }
    }
}

/*
Handles situations when an AI unit switches sides during THEIR phase.

EnemyTurn._checkNextOrderUnit() sifts through available units for the AI to control using this function.
Therefore, it should be safe to run a generator event at that point to switch allegiances
without causing the game to crash; this function will check if the unit that moved has
the "becomeAlly" custom parameter set to true and will change that unit's allegiance if so.
*/
var alias3 = EnemyTurn._isOrderAllowed;
EnemyTurn._isOrderAllowed = function(unit) {
    var result = alias3.call(this, unit); 
    //root.log("AI unit being checked during their phase is: " + unit.getName());
    
    // It seems result is false if the enemy unit has fully completed their action.
    if(!result){
        if(unit.custom.becomeAlly == true) {
            delete unit.custom.becomeAlly;
            var generator = root.getEventGenerator();
            if (unit.getUnitType() == UnitType.ENEMY) {
                //root.log("ENEMY CHANGING ON ENEMY PHASE!");
                generator.unitAssign(unit, UnitType.ALLY);
                generator.execute();                        
            }
            else if (unit.getUnitType() == UnitType.ALLY) {
                //root.log("ALLY CHANGING ON ALLY PHASE!");
                generator.unitAssign(unit, UnitType.ENEMY);
                generator.execute();                        
            }
        }
        return false;
    }
    return true;
}

}) ();