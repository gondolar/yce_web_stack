let buttonSelected = 0;
let color_selected  = {back: "#00aedb", font: "#a0cee8"}; //{back: "#00aedb", font: "#a0cee8"};
let color_hovered   = {back: "#000000", font: "#b0dee8"}; //{back: "#00aedb", font: "#b0dee8"};
let color_idle      = {back: "#203040", font: "#408edb"}; //{back: "#204080", font: "#408edb"};

function buttonRefresh(buttons, iButton) {
    let buttonName  = buttons[iButton];
    let isSelected  = iButton == buttonSelected;
    let prefixes    = ["td_", "a_"];
    for(let prefix in prefixes){
        console.log(prefixes[prefix] + buttonName);
        let el          = document.getElementById(prefixes[prefix] + buttonName);
        el.style.backgroundColor    = isSelected ? color_selected.back : color_idle.back;
        el.style.color              = isSelected ? color_selected.font : color_idle.font;
    }
}
function buttonSelect(buttons, indexSelected) {
    buttonSelected = indexSelected % buttons.length;
    for(let iButton in buttons)
        buttonRefresh(buttons, parseInt(iButton));
}
function buttonHover(buttons, indexHovered) {
    for(let iButton in buttons) {
        let indexButton = parseInt(iButton);
        let isHovered   = indexButton == indexHovered;
        if(false == isHovered)
            buttonRefresh(buttons, indexButton);
        else {
            let buttonName  = buttons[iButton];
            let isSelected  = indexButton == buttonSelected;
            let prefixes    = ["td_", "a_"];
            for(let prefix in prefixes){
                console.log(prefixes[prefix] + buttonName);
                let el          = document.getElementById(prefixes[prefix] + buttonName);
                el.style.backgroundColor    = isSelected ? color_selected.back : color_hovered.back;
                el.style.color              = isSelected ? color_selected.font : color_hovered.font;
            }
        }
    }
}
function adjustForMobile() {
	//body_table = document.getElementById("body_table");
	//body_table.style.width = "100%";
}
function initPage() {
	let browser_is_mobile = isMobile(); 
    let target_iframe   = "iframe_main";
    if(browser_is_mobile) 
		adjustForMobile();

    menuItemRows = "";
    //for(let item in settings_buttons) {
    //    let menu_name       = settings_buttons[item];
    //    let actions         = `onclick="buttonSelect(settings_buttons, ${item}); document.getElementById('a_${menu_name}').click();" `;
    //    let actions_move    = `onmouseover="buttonHover(settings_buttons, ${item});" onmouseout="buttonRefresh(settings_buttons, ${item});" `;
    //    let cell_content    = `<a id="a_${menu_name}" ${actions} ${actions_move} target="${target_iframe}" href="/form/${menu_name}" >${menu_name.toUpperCase()}</a>`;
    //    menuItemRows        += `<tr style="height:24px;"><td id="td_${menu_name}" ${actions} ${actions_move} >${cell_content}</td></tr>`;
    //}

    menuItemRows        += `<tr style="height:100%;" ><td id="td_menu_remainder" ></td></tr>`;
    document.getElementById("menu_table").innerHTML += menuItemRows;

    //buttonSelect(settings_buttons, 0);
}