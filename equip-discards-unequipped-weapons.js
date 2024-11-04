/*
equip-discards-unequipped-weapons.js by CeruleanAcorn

Version 1.0: 11/04/2024
	- Initial Public Release

With this plugin, if the unit equips a weapon with the custom parameter "equipDiscardsUnequippedWeapons" set to true,
all other weapons in the unit's inventory without the "Important Item" designation will be discarded. How scary!

This plugin involves adding a new function, "discardUnequippedWeapons(unit)".

Custom parameter declaration:
{equipDiscardsUnequippedWeapons: true}
*/

(function() {
    discardUnequippedWeapons = function (unit) {
        // At this point, the swapping of items to move the equipped item to the top of the unit's 
        // inventory list is done, so now we can remove all the other items.
        // Let's use an array that tracks the indexes to delete.
        var i, item;
        var indexesToDelete = [];
        var count = UnitItemControl.getPossessionItemCount(unit);
                
        // We'll start from the end of the list since removing things
        // from the beginnning will shift the rest of the indexes making traversing
        // through the unit's inventory wonky.
        for (i = count; i > 0; i--) {
           item = UnitItemControl.getItem(unit, i);
           
           // item != null seems to cover cases where a blank in the inventory can form 
           // (see UnitItemControl.arrangeItem). This plugin crashes without this inclusion.
           // item.isWeapon() makes this only delete weapons.
           // !item.isImportance() makes this only delete non-"Important Item" items.
           if(item != null && item.isWeapon() && !item.isImportance()){
               indexesToDelete.push(i);
            }
        }
        
        for (i = 0; i < indexesToDelete.length; i++){
            item = UnitItemControl.getItem(unit, indexesToDelete[i]);
            ItemControl.deleteItem(unit, item);
            ItemControl.updatePossessionItem(unit);
        }
    };

    // Accounts for cases where the unit ends up equipping a weapon automatically post-combat.
    var alias1 = ItemControl.getEquippedWeapon;
    ItemControl.getEquippedWeapon = function(unit) { 
        var equippedWeapon = alias1.call(this, unit);
        
        if(equippedWeapon != null && equippedWeapon.custom.equipDiscardsUnequippedWeapons == true){
            discardUnequippedWeapons(unit);
        }
      
        return equippedWeapon;
    };
    
    // Handles cases for actively setting the equipped weapon outside of combat.
    var alias2 = ItemControl.setEquippedWeapon;
    ItemControl.setEquippedWeapon = function(unit, targetItem) {
        alias2.call(this, unit, targetItem);
        var equippedWeapon = ItemControl.getEquippedWeapon(unit);
        
        if(equippedWeapon.custom.equipDiscardsUnequippedWeapons == true){
            discardUnequippedWeapons(unit);
        }
    };
}) ();