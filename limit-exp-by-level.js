/*
limit-exp-by-level.js by CeruleanAcorn

Version 1.0: 01/11/2024 
- Initial Public Release

This plugin allows the reduction (via division, rounding down) of EXP gained by a unit based on whether or not their level and class rank 
(unpromoted or promoted) is equal to or above certain thresholds.

If the unit's level and class rank is equal to or greater than the numbers specified within a current map's custom parameters, 
then the EXP they gain is reduced by dividing the EXP they would normally get with a flat value.
This affects EXP from combat and when EXP gain is specified in-engine, item use (i.e Staves).

The custom parameters for this plugin are as follows:

levelForExpLimiter: Number. MANDATORY TO USE THIS PLUGIN TO DIVIDE EXP! 
Compared with the unit's level to determine if their EXP is divided or not. By default or if <= 0, null.
classRankForExpLimiter: Number. Determines what class rank is the minimum for the limit to be imposed. By default, 0.
expDividerWhenEqualLevelLimit: Number. Total EXP will be divided by this if the unit's level equals levelForExpLimiter. By default or if =< 0, 2.
expDividerWhenAboveLevelLimit: Number. Total EXP will be divided by this if the unit's level is above levelForExpLimiter. By default or if =< 0, 4.

Note: You can determine the class rank by going to Database -> Classes -> Button that says "Low" or "High" above the "Description" text input. 
As defined in the ClassRank enum found in the Scripts folder's constants-enumeratedtype.js file, 0 = Low, 1 = High. 

Example Custom Parameter Declarations:

{levelForExpLimiter: 10, expDividerWhenEqualLevelLimit: 2, expDividerWhenAboveLevelLimit: 4}

classRankForExpLimiter was not defined, so it is by default set to 0.
Units that are UNPROMOTED ("low" class) and are AT level 10 will gain 1/2 their normal EXP. 
If they are UNPROMOTED and are ABOVE level 10 they will gain 1/4 their normal EXP.
If they are PROMOTED ("high" class), then no matter what level they are, they will gain 1/4 their normal EXP.
***
{levelForExpLimiter: 2, classRankForExpLimiter: 1, expDividerWhenEqualLevelLimit: 4, expDividerWhenAboveLevelLimit: 10}

Units that are UNPROMOTED ("low" class) will have no EXP limit imposed on them.
If they are PROMOTED ("high" class), then...
	- If they are level 2, they will gain 1/4 their normal EXP.
	- If they are above level 2, they will gain 1/10 their normal EXP.
	- If they are below level 2, they will have no EXP limit imposed on them.
***
{levelForExpLimiter: 1, classRankForExpLimiter: 0, expDividerWhenEqualLevelLimit: 0, expDividerWhenAboveLevelLimit: -1}

Because expDividerWhenEqualLevelLimit and expDividerWhenAboveLevelLimit are defined as below 1, 
they are instead changed to be their default values of 2 and 4, respectively. 
Units that are UNPROMOTED ("low" class) and are AT level 1 will gain 1/2 their normal EXP. 
If they are UNPROMOTED and are ABOVE level 1 they will gain 1/4 their normal EXP.
If they are PROMOTED ("high" class), then no matter what level they are, they will gain 1/4 their normal EXP.
***
{classRankForExpLimiter: 0, expDividerWhenAtLevelLimit: 6, expDividerWhenAboveLevelLimit: 12}

Unit levels and class ranks won't be compared with other values at all since levelForExpLimiter wasn't defined; EXP calculation doesn't change.
 */

(function() {
calculateExpDivider = function (unit, levelForExpLimiter, classRankForExpLimiter, expDividerWhenEqualLevelLimit, expDividerWhenAboveLevelLimit) {
	var expDivider = 0;
	var unitLevel = unit.getLV();
	var unitClassRank = unit.getClass().getClassRank();
	// root.log("levelForExpLimiter: " + levelForExpLimiter);
	// root.log("classRankForExpLimiter: " + classRankForExpLimiter);
	// root.log("expDividerWhenEqualLevelLimit: " + expDividerWhenEqualLevelLimit);
	// root.log("expDividerWhenAboveLevelLimit: " + expDividerWhenAboveLevelLimit);
	// root.log("Unit's level: " + unitLevel);
	// root.log("Unit's class rank: " + unitClassRank);
	
	// If unit's ClassRank is higher, apply the "greater than" limit
	// If equal, compare unit level to determine limit
	// If less than, no limit decided.
	if(unitClassRank > classRankForExpLimiter){
		// root.log("Class rank Greater Than!");
		expDivider = expDividerWhenAboveLevelLimit;
	} else if (unitClassRank == classRankForExpLimiter) {
		// root.log("Class rank Equal!");
		// If unit level is less than, no limit decided, either.
		if (unitLevel > levelForExpLimiter) { 
			// root.log("Unit level Greater Than!");
			expDivider = expDividerWhenAboveLevelLimit;
		} else if (unitLevel == levelForExpLimiter) {
			// root.log("Unit Level Equal!");
			expDivider = expDividerWhenEqualLevelLimit;
		}
	}
	return expDivider;
};

// Instead of editing ExperienceCalculator.calculateExperience and item-base.js'  _getItemByExperience separately,
// just override ExperienceCalculator.getBestExperience which both of them use.
var getBestExperienceAlias = ExperienceCalculator.getBestExperience;
ExperienceCalculator.getBestExperience = function(unit, exp){
		var baseExp = getBestExperienceAlias.call(this, unit, exp);
		// root.log("Base EXP is: " + exp);
		var mapCustomParameters = root.getCurrentSession().getCurrentMapInfo().custom;
		var levelForExpLimiter = mapCustomParameters.levelForExpLimiter != undefined
			&& mapCustomParameters.levelForExpLimiter > 0 ? mapCustomParameters.levelForExpLimiter : null;
		
		if (levelForExpLimiter != null) {
			// root.log("Level for EXP-limiting has been defined. Calculating division factor.");
			var classRankForExpLimiter = mapCustomParameters.classRankForExpLimiter >= 0
				&& mapCustomParameters.classRankForExpLimiter != undefined ? mapCustomParameters.classRankForExpLimiter : 0;
			var expDividerWhenEqualLevelLimit = mapCustomParameters.expDividerWhenEqualLevelLimit > 0 
				&& mapCustomParameters.expDividerWhenEqualLevelLimit != undefined ? mapCustomParameters.expDividerWhenEqualLevelLimit : 2;
			var expDividerWhenAboveLevelLimit = mapCustomParameters.expDividerWhenAboveLevelLimit > 0
				&& mapCustomParameters.expDividerWhenAboveLevelLimit != undefined ? mapCustomParameters.expDividerWhenAboveLevelLimit : 4;
			var expDivider = calculateExpDivider(unit, levelForExpLimiter, classRankForExpLimiter, 
				expDividerWhenEqualLevelLimit, expDividerWhenAboveLevelLimit);
			if(expDivider != 0){
				// Decimal values can result from this division, which causes the "exp gained" window to glitch. 
				// Therefore, use a rounding function to automatically round the value down to the nearest whole number.
				// Change "Math.floor" to "Math.ceiling" if you always want the exp to round up to the nearest whole number instead.
				var roundedExp = Math.floor(baseExp/expDivider);
				// root.log("expDivider is: " + expDivider);
				// root.log("The final EXP gained is: " + roundedExp);
				return roundedExp;
			}
		}
		return baseExp;
};
})()
