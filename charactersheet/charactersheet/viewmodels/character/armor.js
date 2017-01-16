'use strict';

function ArmorViewModel() {
    var self = this;

    self._dummy = ko.observable(null);
    self.selecteditem = ko.observable();
    self.blankArmor = ko.observable(new Armor());
    self.armors = ko.observableArray([]);
    self.currencyDenominationList = ko.observableArray(Fixtures.general.currencyDenominationList);
    self.shouldShowDisclaimer = ko.observable(false);
    self.previewTabStatus = ko.observable('active');
    self.editTabStatus = ko.observable('');
    self.firstModalElementHasFocus = ko.observable(false);
    self.editFirstModalElementHasFocus = ko.observable(false);

    self.sorts = {
        'armorName asc': { field: 'armorName', direction: 'asc'},
        'armorName desc': { field: 'armorName', direction: 'desc'},
        'armorType asc': { field: 'armorType', direction: 'asc'},
        'armorType desc': { field: 'armorType', direction: 'desc'},
        'armorEquipped asc': { field: 'armorEquipped', direction: 'asc', booleanType: true},
        'armorEquipped desc': { field: 'armorEquipped', direction: 'desc', booleanType: true}
    };

    self.filter = ko.observable('');
    self.sort = ko.observable(self.sorts['armorName asc']);

    self.init = function() {
        Notifications.global.save.add(function() {
            self.armors().forEach(function(e, i, _) {
                e.save();
            });
        });
    };

    self.load = function() {
        var key = CharacterManager.activeCharacter().key();
        self.armors(Armor.findAllBy(key));
        Notifications.abilityScores.changed.add(self.valueHasChanged);
    };

    self.unload = function() {
        $.each(self.armors(), function(_, e) {
            e.save();
        });
        Notifications.abilityScores.changed.remove(self.valueHasChanged);
    };

    self.totalWeight = ko.pureComputed(function() {
        var weight = 0;
        if(self.armors().length > 0) {
            $.each(self.armors(), function(_, e) {
                weight += e.armorWeight() ? parseInt(e.armorWeight()) : 0;
            });
        }
        return weight + ' (lbs)';
    });

    self.equipArmorHandler = ko.computed(function() {
        ko.utils.arrayForEach(self.armors(), function(item) {
            if(item.armorType() !== 'Shield' && item.armorEquipped() && self.selecteditem() == item) {
                ko.utils.arrayForEach(self.armors(), function(item2) {
                    if(item != item2 && item2.armorType() != 'Shield') {
                        item2.armorEquipped('');
                    }
                });
            } else if(item.armorType() === 'Shield' && item.armorEquipped() && self.selecteditem() == item) {
                ko.utils.arrayForEach(self.armors(), function(item2) {
                    if(item != item2 && item2.armorType() == 'Shield') {
                        item2.armorEquipped('');
                    }
                });
            }
        });
    });

    self.shieldEquipped = ko.computed(function() {
        var shield = ko.utils.arrayFilter(self.armors(), function(item) {
            return item.armorType() === 'Shield' && item.armorEquipped();
        });
        return shield.length === 1;
    });

    self.baseAC = ko.pureComputed(function() {
        var ac = 10;
        var armor = ko.utils.arrayFilter(self.armors(), function(item) {
            return item.armorType() !== 'Shield' && item.armorEquipped();
        });

        if(armor.length === 0) {
            return ac;
        } else {
            ac = parseInt(armor[0].armorClass().slice(0, 2));
        }
        return ac;
    })

    self.equippedArmorMagicalModifer = ko.pureComputed(function() {
        var magicalModifier = 0;
        var armor = ko.utils.arrayFilter(self.armors(), function(item) {
            return item.armorType() !== 'Shield' && item.armorEquipped();
        });

        if(armor.length > 0) {
            magicalModifier = parseInt(armor[0].armorMagicalModifier());
        }
        return magicalModifier;
    });

    self.equippedShieldMagicalModifer = ko.pureComputed(function() {
        var magicalModifier = 0;
        var shield = ko.utils.arrayFilter(self.armors(), function(item) {
            return item.armorType() === 'Shield' && item.armorEquipped();
        });

        if(shield.length > 0) {
            magicalModifier = parseInt(shield[0].armorMagicalModifier());
        }
        return magicalModifier;
    });

    self.dexBonus = function() {
        var score = AbilityScores.findBy(
                CharacterManager.activeCharacter().key())[0].modifierFor('Dex');

        return score;
    };

    self.calculatedAC = ko.pureComputed(function() {
        self._dummy();
        var calculatedAC = self.baseAC();
        var dexBonus = self.dexBonus();
        var armorMagicalModifier = self.equippedArmorMagicalModifer();
        var shieldMagicalModifer = self.equippedShieldMagicalModifer();

        if(self.armors().length > 0) {
            ko.utils.arrayForEach(self.armors(), function(item){
                if(item.armorEquipped()){
                    switch(item.armorType()){
                        case 'Light':
                            calculatedAC = calculatedAC + armorMagicalModifer + dexBonus;
                            break;
                        case 'Medium':
                            // max dex bonus for medium is 2
                            if(dexBonus > 2){
                                var adjDexBonus = 2;
                            } else {
                                adjDexBonus = dexBonus;
                            }
                            calculatedAC = calculatedAC + armorMagicalModifier + adjDexBonus;
                            break;
                        case 'Heavy':
                            calculatedAC = calculatedAC + armorMagicalModifier + dexBonus;
                            break;
                        case 'Shield':
                            calculatedAC = calculatedAC + shieldMagicalModifer + 2;
                            break;
                    }
                }
            });
        }
        return calculatedAC;
    });

    /* Modal Methods */

    self.armorsPrePopFilter = function(request, response) {
        var term = request.term.toLowerCase();
        var keys = DataRepository.armors ? Object.keys(DataRepository.armors) : [];
        var results = keys.filter(function(name, idx, _) {
            return name.toLowerCase().indexOf(term) > -1;
        });
        response(results);
    };

    self.populateArmor = function(label, value) {
        var armor = DataRepository.armors[label];

        self.blankArmor().importValues(armor);
        self.shouldShowDisclaimer(true);
    };

    self.modalFinishedAnimating = function() {
        self.shouldShowDisclaimer(false);
    };

    // Modal methods
    self.modalFinishedOpening = function() {
        self.shouldShowDisclaimer(false);
        self.firstModalElementHasFocus(true);
    };

    self.modalFinishedClosing = function() {
        self.previewTabStatus('active');
        self.editTabStatus('');
        self.previewTabStatus.valueHasMutated();
        self.editTabStatus.valueHasMutated();
    };

    self.selectPreviewTab = function() {
        self.previewTabStatus('active');
        self.editTabStatus('');
    };

    self.selectEditTab = function() {
        self.editTabStatus('active');
        self.previewTabStatus('');
        self.editFirstModalElementHasFocus(true);
    };

    /* UI Methods */

    /**
     * Filters and sorts the armors for presentation in a table.
     */
    self.filteredAndSortedArmors = ko.computed(function() {
        return SortService.sortAndFilter(self.armors(), self.sort(), null);
    });

    /**
     * Determines whether a column should have an up/down/no arrow for sorting.
     */
    self.sortArrow = function(columnName) {
        return SortService.sortArrow(columnName, self.sort());
    };

    /**
     * Given a column name, determine the current sort type & order.
     */
    self.sortBy = function(columnName) {
        self.sort(SortService.sortForName(self.sort(),
            columnName, self.sorts));
    };

    //Manipulating armors
    self.addArmor = function() {
        var armor = self.blankArmor();
        armor.characterId(CharacterManager.activeCharacter().key());
        armor.save();
        self.armors.push(armor);
        self.blankArmor(new Armor());
    };

    self.removeArmor = function(armor) {
        self.armors.remove(armor);
        armor.delete();
    };

    self.editArmor = function(armor) {
        self.selecteditem(armor);
    };

    self.clear = function() {
        self.armors([]);
    };

    self.valueHasChanged = function() {
        self.armors().forEach(function(e, i, _) {
            e.updateValues();
        });
        self._dummy.valueHasMutated();
    };
}
