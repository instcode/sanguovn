/**
 * Created by JetBrains PhpStorm.
 * User: none
 * Date: 7/7/11
 * Time: 12:46 AM
 * To change this template use File | Settings | File Templates.
 */

$(document).ready(function() {
    // Append server lists
    var item = {};
    appendSelectBox(servers, $("#lstServer"));
    appendSelectBox(maps, $("#lstMap"));
    getNpc($("#lstMap").val());
    $("#lstMap").change(function(){
        getNpc($("#lstMap").val());
    });
});

function appendSelectBox(items, selectBox) {
    for (var index = 0; index < items.length; index++) {
        item = items[index];
        selectBox.append(new Option(item.name, item.id));
    }
}

function getNpc(mapId){
    var npcs = [];
    for (var index = 0; index < maps.length; index++) {
        if (maps[index].id == mapId) {
            npcs = maps[index].npc;
            break;
        }
    }
    // Clear current NPC list
    $("#lstNpc").find('option').remove().end();
    appendSelectBox(npcs, $("#lstNpc"));
    return npcs;
}