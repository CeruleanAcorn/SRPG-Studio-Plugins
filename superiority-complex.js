/*
superiority-complex-js by CeruleanAcorn

Version 1.0: 11/09/2022
    - Initial Public Release
Version 1.1: 09/02/2024
 - Slight code efficiency upgrade: functions for each possible stat 
   modification will automatically return unmodified stat values if the 
   number given in the corresponding custom parameter is less than 0.

With this plugin, using a skill with the custom keyword "superiority-complex", this unit's damage, targeted defensive stat, hit, avo, crit, crit avo and agility (*)
can all be modified depending on the matching or mismatching of the unit and their target's weapon type and stat target (physical vs magical weapons).
For example, you can boost the unit's values in any of the aforementioned areas if they are both wielding the same weapon type.

This PLUGIN IS NOT PLUG AND PLAY!!

The custom parameters for this plugin are as follows:

MANDATORY:

sameWeaponTypeOnly: Either this and/or sameStatTargetOnly must be defined true or false for this skill to have a chance of activating!
- If true, the skill will trigger if the unit and their target's equipped weapons have the same weapon type name.
- If false, the skill will trigger if the unit and their target's equipped weapons DO NOT have the same weapon type name.
- If null (default if not declared as a custom parameter or declared as another other valid options), it will not be used to determine the triggering of the skill.

sameStatTargetOnly: Either this and/or sameWeaponTypeOnly must be defined true or false for this skill to have a chance of activating!
- If true, the skill will trigger if the unit and their target's equipped weapons target the same defensive stat (are both physical, or both magical weapons).
- If false, the skill will trigger if the unit and their target's equpped weapons do NOT target the same defensive stat (are NOT both physical nor magical weapons).
- if null (default if not declared as a custom parameter or declared as other valid options), it will not be used to determine the triggering of the skill.

---

OPTIONAL:

powerBoost: Modifier for unit's attack stat when skill is triggered. By default, 4.
defenseBoost: Modifier for unit's targeted defensive stat when skill is triggered. By default, 4.
hitBoost: Modifier for unit's hit when skill is triggered. By default, 0.
avoidBoost: Modifier for unit's avoid when skill is triggered. By default, 0.
critBoost: Modifier for unit's crit when skill is triggered. By default, 0.
critAvoidBoost: Modifier for unit's crit avoid when skill is triggered. By default, 0.

agilityBoost: Modifier for unit's agility when skill is triggered. By default, 0.
- (*) Two things to note for this:
    - By default, to prevent plugin clashing, this will NOT be used unless certain parts of code are uncommented (see warning below).
    -  Your project must have "Allow Pursuit" checked. Find it in "Database" -> "Difficulties" -> "Options".

logicOperator: Logic operator for use with sameWeaponTypeOnly and sameStatTargetOnly, when both are not null.
- If "&&", the skill will be activated if the aforementioned pair of conditions is met.
- If "||" (Default if not declared as a custom parameter or a valid value), the skill will be activated if either one of the aforementioned pair of conditions is met.
- This won't be used if sameWeaponTypeOnly and/or sameStatTargetOnly are null.

Example declarations of custom parameters:

sameWeaponTypeOnly: true, sameStatTargetOnly: (isn't declared, so it's null)
- The skill triggers if the user and their target are wielding the same weapon type.

sameWeaponTypeOnly: false, sameStatTargetOnly: (isn't declared, so it's null)
- The skill triggers if the user and their target are NOT wielding the same weapon type.

sameWeaponTypeOnly: true, sameStatTargetOnly: true, logicOperator: '&&'
- The skill triggers if the user and their target are wielding the same weapon type AND their equipped weapons target the same stat.

sameWeaponTypeOnly: false, sameStatTargetOnly: false, logicOperator: '||'
- The skill triggers if the user and their target are NOT wielding the same weapon type OR their equipped weapons DO NOT target the same stat.

 ********** W A R N I N G ! ! ! **********

Functions overridden without an alias:
 * Calculator.calculateRoundCount

To ensure modifying agility works properly in this plugin
this plugin changes the logic of an existing function without an alias (see Calculator.calculateRoundCount below).
Because this means the plugin may clash with any other that work with the function listed above,
the applicable lines of code have been commented out, and can BOTH be uncommented where marked at your own discretion (and risk).

If you are working with plugins that also overide the above without an alias, ensure that they are named alphabetically AFTER this plugin's filename to use this.

 *****************************************

Special thanks go to these folks who have helped the development of this plugin:
- Goinza
- Anarch16sync
- Maple
- Repeat

The last of which having graciously taken the time to write the portion of this plugin that overrides Calculator.calculateRoundCount.
 */

(function () {

    var alias1 = SkillRandomizer.isCustomSkillInvokedInternal;
    SkillRandomizer.isCustomSkillInvokedInternal = function (active, passive, skill, keyword) {
        if (keyword === 'superiority-complex') {
            return this._isSkillInvokedInternal(active, passive, skill);
        }
        return alias1.call(this, active, passive, skill, keyword);
}

    // Find the CompatibleCalculator Object in singleton-calculator.js
    var alias2 = CompatibleCalculator.getPower;
    CompatibleCalculator.getPower = function (active, passive, weapon) {
        var power = alias2.call(this, active, passive, weapon);
        var theSkill = SkillControl.getPossessionCustomSkill(active, "superiority-complex");
        if (theSkill != null) {
            var powerBoost = theSkill.custom.powerBoost != undefined ? theSkill.custom.powerBoost : 4;
            // Number given must be greater than 0 for rest of code to trigger.
            if (powerBoost > 0) {
                var sameWeaponTypeOnly = theSkill.custom.sameWeaponTypeOnly != undefined ? theSkill.custom.sameWeaponTypeOnly : null;
                var sameStatTargetOnly = theSkill.custom.sameStatTargetOnly != undefined ? theSkill.custom.sameStatTargetOnly : null;
                var logicalOperator = theSkill.custom.logicalOperator != undefined ? theSkill.custom.logicalOperator : '||';
                var enemyWeapon = ItemControl.getEquippedWeapon(passive);
                if (isBoostApplied(weapon, enemyWeapon, sameWeaponTypeOnly, sameStatTargetOnly, logicalOperator)) {
                    power += powerBoost;
                }
            }
        }
        // root.log("power: " + power);
        return Math.floor(power);
    }

    var alias3 = CompatibleCalculator.getDefense;
    CompatibleCalculator.getDefense = function (active, passive, weapon) {
        var defense = alias3.call(this, active, passive, weapon);
        var theSkill = SkillControl.getPossessionCustomSkill(active, "superiority-complex");
        if (theSkill != null) {
            var defenseBoost = theSkill.custom.defenseBoost != undefined ? theSkill.custom.defenseBoost : 4;
            if (defenseBoost > 0) {
                var sameWeaponTypeOnly = theSkill.custom.sameWeaponTypeOnly != undefined ? theSkill.custom.sameWeaponTypeOnly : null;
                var sameStatTargetOnly = theSkill.custom.sameStatTargetOnly != undefined ? theSkill.custom.sameStatTargetOnly : null;
                var logicalOperator = theSkill.custom.logicalOperator != undefined ? theSkill.custom.logicalOperator : '||';
                var enemyWeapon = ItemControl.getEquippedWeapon(passive);
                if (isBoostApplied(weapon, enemyWeapon, sameWeaponTypeOnly, sameStatTargetOnly, logicalOperator)) {
                    defense += defenseBoost;
                }
            }
        }
        // root.log("defense: " + defense);
        return Math.floor(defense);
    }

    var alias4 = CompatibleCalculator.getHit;
    CompatibleCalculator.getHit = function (active, passive, weapon) {
        var hitRate = alias4.call(this, active, passive, weapon);
        var theSkill = SkillControl.getPossessionCustomSkill(active, "superiority-complex");
        if (theSkill != null) {
            var hitBoost = theSkill.custom.hitBoost != undefined ? theSkill.custom.hitBoost : 50;
            if (hitBoost > 0) {
                var sameWeaponTypeOnly = theSkill.custom.sameWeaponTypeOnly != undefined ? theSkill.custom.sameWeaponTypeOnly : null;
                var sameStatTargetOnly = theSkill.custom.sameStatTargetOnly != undefined ? theSkill.custom.sameStatTargetOnly : null;
                var logicalOperator = theSkill.custom.logicalOperator != undefined ? theSkill.custom.logicalOperator : '||';
                var enemyWeapon = ItemControl.getEquippedWeapon(passive);
                if (isBoostApplied(weapon, enemyWeapon, sameWeaponTypeOnly, sameStatTargetOnly, logicalOperator)) {
                    hitRate += hitBoost;
                }
            }
            
            if (SkillControl.getPossessionCustomSkill(active, "TrueshotCL") != null) {
                return hitRate;
            }

            if (weapon.custom.TrueshotCL) {
                return hitRate;
            }
        }
        // root.log("hit: " + hitRate);
        return Math.floor(hitRate);
    }

    var alias5 = CompatibleCalculator.getAvoid;
    CompatibleCalculator.getAvoid = function (active, passive, weapon) {
        var avoid = alias5.call(this, active, passive, weapon);
        var theSkill = SkillControl.getPossessionCustomSkill(active, "superiority-complex");
        if (theSkill != null) {
            var avoidBoost = theSkill.custom.avoidBoost != undefined ? theSkill.custom.avoidBoost : 0;
            if (avoidBoost > 0) {
                var sameWeaponTypeOnly = theSkill.custom.sameWeaponTypeOnly != undefined ? theSkill.custom.sameWeaponTypeOnly : null;
                var sameStatTargetOnly = theSkill.custom.sameStatTargetOnly != undefined ? theSkill.custom.sameStatTargetOnly : null;
                var logicalOperator = theSkill.custom.logicalOperator != undefined ? theSkill.custom.logicalOperator : '||';
                var enemyWeapon = ItemControl.getEquippedWeapon(passive);

                if (isBoostApplied(weapon, enemyWeapon, sameWeaponTypeOnly, sameStatTargetOnly, logicalOperator)) {
                    avoid += avoidBoost;
                }
            }
        }
        // root.log("avoid: " + avoid);
        return Math.floor(avoid);
    }

    var alias6 = CompatibleCalculator.getCritical;
    CompatibleCalculator.getCritical = function (active, passive, weapon) {
        var crit = alias6.call(this, active, passive, weapon);
        var theSkill = SkillControl.getPossessionCustomSkill(active, "superiority-complex");
        if (theSkill != null) {
            var critBoost = theSkill.custom.critBoost != undefined ? theSkill.custom.critBoost : 0;
            if (critBoost > 0) {
                var sameWeaponTypeOnly = theSkill.custom.sameWeaponTypeOnly != undefined ? theSkill.custom.sameWeaponTypeOnly : null;
                var sameStatTargetOnly = theSkill.custom.sameStatTargetOnly != undefined ? theSkill.custom.sameStatTargetOnly : null;
                var logicalOperator = theSkill.custom.logicalOperator != undefined ? theSkill.custom.logicalOperator : '||';
                var enemyWeapon = ItemControl.getEquippedWeapon(passive);
                if (isBoostApplied(weapon, enemyWeapon, sameWeaponTypeOnly, sameStatTargetOnly, logicalOperator)) {
                    crit += critBoost;
                }
            }
        }
        // root.log("crit: " + crit);
        return Math.floor(crit);
    }

    var alias7 = CompatibleCalculator.getCriticalAvoid;
    CompatibleCalculator.getCriticalAvoid = function (active, passive, weapon) {
        var critAvoid = alias7.call(this, active, passive, weapon);
        var theSkill = SkillControl.getPossessionCustomSkill(active, "superiority-complex");
        if (theSkill != null) {
            var critAvoidBoost = theSkill.custom.critAvoidBoost != undefined ? theSkill.custom.critAvoidBoost : 0;
            if (critAvoidBoost > 0) {
                var sameWeaponTypeOnly = theSkill.custom.sameWeaponTypeOnly != undefined ? theSkill.custom.sameWeaponTypeOnly : null;
                var sameStatTargetOnly = theSkill.custom.sameStatTargetOnly != undefined ? theSkill.custom.sameStatTargetOnly : null;
                var logicalOperator = theSkill.custom.logicalOperator != undefined ? theSkill.custom.logicalOperator : '||';
                var enemyWeapon = ItemControl.getEquippedWeapon(passive);
                if (isBoostApplied(weapon, enemyWeapon, sameWeaponTypeOnly, sameStatTargetOnly, logicalOperator)) {
                    critAvoid += critAvoidBoost;
                }
            }
        }
        // root.log("critAvoid: " + critAvoid);
        return Math.floor(critAvoid);
    }

    // To modify agility with this plugin, "Allow Pursuit" must be ENABLED in your project's difficulty settings ("Config" -> "Difficulties")
    // To ensure this plugin does not clash with any others using Calculator.calculateRoundCount by default, this code is commented out from HERE...
    /*
    var alias8 = CompatibleCalculator.getAgility;
    CompatibleCalculator.getAgility = function (active, passive, weapon) {
        root.log("Allow Pursuit is enabled - CompatibleCalculator.getAgility runs!");
        var agility = alias8.call(this, active, passive, weapon);
        var theSkill = SkillControl.getPossessionCustomSkill(active, "superiority-complex");
        if (theSkill != null) {
            var agilityBoost = theSkill.custom.agilityBoost != undefined ? theSkill.custom.agilityBoost : 0;
            if (agilityBoost > 0) {
                var sameWeaponTypeOnly = theSkill.custom.sameWeaponTypeOnly != undefined ? theSkill.custom.sameWeaponTypeOnly : null;
                var sameStatTargetOnly = theSkill.custom.sameStatTargetOnly != undefined ? theSkill.custom.sameStatTargetOnly : null;
                var logicalOperator = theSkill.custom.logicalOperator != undefined ? theSkill.custom.logicalOperator : '||';
                var enemyWeapon = ItemControl.getEquippedWeapon(passive);
                if (isBoostApplied(weapon, enemyWeapon, sameWeaponTypeOnly, sameStatTargetOnly, logicalOperator)) {
                    agility += agilityBoost;
                }
            }
        }
        root.log("agility: " + agility);
        return Math.floor(agility);
    }
    */
    //...To HERE. Remove the /* and */ nested within these boundaries AND around Calculator.calculateRoundCount to allow this plugin to modify the user's agility.
})();

isBoostApplied = function (weapon, enemyWeapon, sameWeaponTypeOnly, sameStatTargetOnly, logicalOperator) {
    var result = false;
    if (enemyWeapon != null) {

        // Debug: Uncomment to view state of custom parameters and boolean evaluations of scenarios that can be checked to trigger the skill
        /*
        root.log("sameweapontypeonly: " + sameWeaponTypeOnly);
        root.log("sameStatTargetOnly: " + sameStatTargetOnly);
        root.log("active weapon type: " + weapon.getWeaponType().getName());
        root.log("passive weapon type: " + enemyWeapon.getWeaponType().getName());
        root.log("Checking if active weapon " + weapon.getName() + " is physical: " + ((Miscellaneous.isPhysicsBattle(weapon))));
        root.log("Checking if target weapon " + enemyWeapon.getName() + " is physical: " + ((Miscellaneous.isPhysicsBattle(enemyWeapon))));
         */

        var weaponCheck = sameWeaponTypeOnly == true ? (weapon.isWeaponTypeMatched(enemyWeapon.getWeaponType())) : (!weapon.isWeaponTypeMatched(enemyWeapon.getWeaponType()));
        var statTargetCheck = sameStatTargetOnly == true ? ((Miscellaneous.isPhysicsBattle(weapon)) == (Miscellaneous.isPhysicsBattle(enemyWeapon))) : !((Miscellaneous.isPhysicsBattle(weapon)) == (Miscellaneous.isPhysicsBattle(enemyWeapon)));

        if (typeof sameWeaponTypeOnly != 'boolean' && typeof sameStatTargetOnly == 'boolean') {
            result = statTargetCheck;
        } else if (typeof sameStatTargetOnly != 'boolean' && typeof sameWeaponTypeOnly == 'boolean') {
            result = weaponCheck;
        } else if (typeof sameStatTargetOnly == 'boolean' && typeof sameWeaponTypeOnly == 'boolean') {
            if (logicalOperator != '&&' && logicalOperator != '||')
                "||";
            var comparisonToEvaluate = "return " + weaponCheck + logicalOperator + statTargetCheck;
            result = Function(comparisonToEvaluate)();
            root.log("whole expression is: " + comparisonToEvaluate); // Debug: Uncomment to view final logical expression to be evaluationed with logicalOperator
        }
    }

    //root.log("result is: " + result); // Debug: Uncomment to view final evaluation of result.
    return result;
}

// The function below prevents the case that this skill enables both units to double each other if one
// who triggers this skill can double after the skill's agility boost is applied, but was getting doubled in the first place.
// Now, only one unit can double the other with this rewrite.

//To ensure this plugin does not clash with any others using Calculator.calculateRoundCount by default, this code is commented out from HERE...

// UNALIASED FUNCTION, rewritten by Repeat
/*
Calculator.calculateRoundCount = function (active, passive, weapon) {
    var activeAgi;
    var passiveAgi;
    var value;

    if (!this.isRoundAttackAllowed(active, passive)) {
        return 1;
    }

    activeAgi = AbilityCalculator.getAgility(active, weapon) + this.getAgilityPlus(active, passive, weapon);
    // checks getAgilityPlus for the defending unit to account for support boosts; swaps passive and active in fn call
    passiveAgi = AbilityCalculator.getAgility(passive, ItemControl.getEquippedWeapon(passive)) + this.getAgilityPlus(passive, active, weapon);
    value = this.getDifference();

    return (activeAgi - passiveAgi) >= value ? 2 : 1;
}
*/
//...To HERE. Remove the /* and */ nested within these boundaries AND around alias8 to allow this plugin to modify the user's agility.
