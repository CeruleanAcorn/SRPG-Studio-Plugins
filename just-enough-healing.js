/*
just-enough-healing.js by CeruleanAcorn

Version 1.0: 07/11/2024 
- Initial Public Release

Using this plugin, with a custom skill with the keyword "just-enough-healing",
If a unit casts healing magic on a target where the total heal strength would be enough to lower the missing HP to
be equal or less than a certain threshold, the target will be healed again, with heal strength equal to their
missing HP.

The custom parameter for this plugin is as follows:

maximumMissingHP: Determines the maximum amount of HP the target unit can be missing after being healed before this skill
doesn't trigger. By default, 5. Number.

Example Custom Parameter Declaration:
{maximumMissingHP: 10}

If the target would be healed to have 10 HP or less than their maximum HP, they would receive another heal
equal to their missing HP to be fully healed instead.

Special thanks to Goinza for their Live to Serve plugin, which was used as the basis for this plugin.

*/
(function() {
	
	// From Goinza's Live to Serve plugin.
	var alias1 = RecoveryItemUse.enterMainUseCycle;
	RecoveryItemUse.enterMainUseCycle = function(itemUseParent) {
		var itemTargetInfo = itemUseParent.getItemTargetInfo();
		this._itemTargetInfo = itemUseParent.getItemTargetInfo();
		return alias1.call(this, itemUseParent);
	}
	
    var alias2 = RecoveryItemUse.moveMainUseCycle;
    RecoveryItemUse.moveMainUseCycle = function() {
        var result = alias2.call(this);
        if (result == MoveResult.END) {
			// this._itemTargetInfo.unit comes from the definition
			// in the overriden RecoveryItemUse.enterMainUseCycle() function above.
            var unit = this._itemTargetInfo.unit;
            var theSkill = SkillControl.getPossessionCustomSkill(unit, "just-enough-healing");
            if(theSkill != null) {
                var item = this._itemTargetInfo.item;    
				// Creating a new DynamicEvent object might not be necessary since
				// RecoveryItemUse already has such a member variable to hold a 
				// DynamicEvent object; use that instead.
				var dynamicEvent = this._dynamicEvent;
				var generator = this._dynamicEvent.acquireEventGenerator();
				var recoveryInfo = item.getRecoveryInfo(); 
				var targetUnit = this._itemTargetInfo.targetUnit;
				// Look at the target unit's missing HP. If it's within the threshold, apply the extra heal.
				var targetUnitMissingHP = ParamBonus.getMhp(targetUnit) - targetUnit.getHp();
				var hpThreshold = theSkill.custom.maximumMissingHP != null ? theSkill.custom.maximumMissingHP : 5;
				if(targetUnitMissingHP != 0 && targetUnitMissingHP <= hpThreshold){
					/*
					Healing animation can begin to play (and is promptly paused) before EXP animation is finished.
					generator.wait(x) can prevent this, but having "x" too low could either
					abruptly end the Level Up stat increase window's appearance or skip it entirely.
					Alternatively, if "x" is too high, it could cause an awkward pause
					after the Level Up stat increase window dissapeared if "x" was too long.
					Things become further complicated when the animations are sped up via controller input
					which can skip the Level Up stat increase window as well if we use generator.wait(x).
					Therefore, generator.wait(x) isn't currently run here.
					*/
					generator.hpRecovery(targetUnit, item.getItemAnime(), targetUnitMissingHP, recoveryInfo.getRecoveryType(), false);
					this._dynamicEvent.executeDynamicEvent();
				}
			}
		} 
        return result;
    }
}) ()
