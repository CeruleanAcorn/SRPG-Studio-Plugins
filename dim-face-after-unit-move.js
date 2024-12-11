/*
dim-face-after-unit-move.js by CeruleanAcorn

Version 1.0: 12/11/2024
    - Initial Public Release

Dims the face displayed on unit info windows of player units who have used up their 
turn during the Player Phase.

********** W A R N I N G ! ! ! **********

Functions overridden without an alias:
    * UnitSimpleRenderer._drawFace
    * UnitMenuTopWindow._drawUnitFace
    
Using any other plugins that modify these functions without an alias as well
can cause a plugin clash.
*/

(function() {
    
    // Change this value to modify the face transparency of a unit that has
    // exhausted their turn. Range can be set between 0-255, 0 meaning fully 
    // transparent and 255 meaning fully opaque.
    var unitExhaustedAlpha = 50;
    
    // For unit's face on the unit info window appearing when hovering over a unit.
    UnitSimpleRenderer._drawFace = function (x, y, unit, textui) {
        var alpha = 255; 
        
        if (unit.isWait()) {
            alpha = unitExhaustedAlpha; 
        }
        
        ContentRenderer.drawUnitFace(x, y, unit, false, alpha);
    }
        
    // For unit's face on the full unit info window.
    UnitMenuTopWindow._drawUnitFace = function (x, y) {
        var alpha = 255;
        
        // If statement and body pulled from original function.
		if (this._unit.getHp() === 0) {
			// Execute when revive.
			alpha = 128;
		} else if (this._unit.isWait()) {
            alpha = unitExhaustedAlpha; 
        }
        
		ContentRenderer.drawUnitFace(x, y, this._unit, false, alpha);
    }
})();
