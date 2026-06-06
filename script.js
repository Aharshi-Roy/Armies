class Unit
{
    constructor(name, holds_strength, cost, available_tiles, able_build, actions)
    {
        this.name = name;
        this.holds_strength = holds_strength;
        this.cost = cost;
        this.available_tiles = available_tiles;
        this.able_build = able_build;
        this.actions = actions;
    }
}

class Player
{
    constructor(color, hover_color)
    {
        this.color = color;
        this.hover_color = hover_color;
    }
}
class Cell
{
    constructor(land_type, unit_type, strength, player)
    {
        this.land_type = land_type;
        this.unit_type = unit_type;
        this.strength = strength;
        this.player = player;
        this.action_state = "unused";

        // Only used in one algorithm
        this.visited = false;
        this.claimed = false;
    }
    is_ore_deposit()
    {
        if (this.land_type == "ore deposit") return true;
        return false;
    }
    save_unit()
    {
        return [this.unit_type, this.strength, this.player];
    }
    load_unit(array)
    {
        this.unit_type = array[0];
        this.strength = array[1];
        this.player = array[2];
    }
    place_unit(name, strength, player, should_use)
    {
        this.unit_type = name;
        this.strength = strength;
        this.player = player;
        if (should_use) this.use();
    }
    remove_unit(should_use)
    {
        this.unit_type = "none";
        this.strength = 0;
        this.player = -1;
        if (should_use) this.use();
    }
    change_strength(change, should_use)
    {
        if (this.strength+change < 0) return "Too little strength";
        else if (this.strength+change > 8) return "Too much strength";
        else
        {
            this.strength += change;
            if (should_use) this.use();
            return "clear";
        }
    }
    use()
    {
        this.action_state = "used";
    }
    return_border_color()
    {
        if (this.action_state == "unused") return "black";
        else if (this.action_state == "being used") return "lime";
        else if (this.action_state == "used") return "tomato";
    }
}
class Action
{
    constructor(cells, action_name, extra_info, game)
    {
        this.cells = cells;
        this.action_name = action_name;
        this.extra_info = extra_info;
        this.game = game;
    }
    do_action()
    {
        let all_unused = true;
        for (let cell of this.cells)
        {
            if (cell.action_state == "used") all_unused = false;
        }
        if (!all_unused) return "Cell is used";
        if (this.action_name == "produce") return this.produce();
        else if (this.action_name == "remove") return this.remove();
        else if (this.action_name == "transact") return this.transact();
        else if (this.action_name == "move") return this.move();
        else if (this.action_name == "build") return this.build();
        else if (this.action_name == "battle") return this.battle();
        else if (this.action_name == "trade") return this.trade();
    }
    produce()
    {
        return this.cells[0].change_strength(1, true);
    }
    remove()
    {
        this.cells[0].remove_unit(false);
        return "clear";
    }
    transact()
    {
        // First Cell is giver, second cell is give to
        let extra_amount = 0;
        if (this.cells[0].is_ore_deposit()) extra_amount++; 
        if (this.cells[1].is_ore_deposit()) extra_amount++; 
        let return1 = this.cells[0].change_strength(-this.extra_info-extra_amount, true);
        let return2 = this.cells[1].change_strength(this.extra_info, true);
        if (return1 == "clear" && return2 == "clear")
        {
            return "clear";
        }
        else
        {
            if (return1 == "clear")
            {
                this.cells[0].change_strength(this.extra_info+extra_amount, true);
            }
            if (return2 == "clear")
            {
                this.cells[1].change_strength(-this.extra_info, true);
            }
            return "invalid";
        }
    }
    move()
    {
        let unit = this.cells[0].save_unit();
        this.cells[0].remove_unit(false);
        this.cells[1].load_unit(unit);
        this.cells[1].action_state = "used";
        return "clear";
    }
    build()
    {
        let extra_amount = 0;
        if (this.cells[0].is_ore_deposit()) extra_amount++; 
        if (this.cells[1].is_ore_deposit()) extra_amount++; 
        if (this.cells[0].change_strength(-this.extra_info[1]-extra_amount, true) == "clear")
        {
            this.cells[1].place_unit(this.extra_info[0], 1, this.extra_info[2], true);
            return "clear";
        }
        else return "invalid";
    }
    battle()
    {
        if (this.cells[0].land_type == "ore deposit") this.cells[0].strength += 2;
        if (this.cells[1].land_type == "ore deposit") this.cells[1].strength += 2;
        let battle_timer = setInterval(() => 
        {
            let random_number = Math.floor(Math.random() * 6);
            if (random_number == 0) this.cells[0].strength -= 2;
            if (random_number == 1 || random_number == 2) this.cells[0].strength--;
            if (random_number == 3 || random_number == 4) this.cells[1].strength--;
            if (random_number == 5) this.cells[1].strength -= 2;

            if (this.cells[0].strength <= 0)
            {
                this.cells[0].remove_unit(false)
                if (this.cells[0].strength > 8) this.cells[0].strength = 8;
                if (this.cells[1].strength > 8) this.cells[1].strength = 8;
                this.cells[1].action_state = "unused";
                clearInterval(battle_timer);
            }
            if (this.cells[1].strength <= 0)
            {
                this.cells[1].remove_unit(false);
                if (this.cells[0].strength > 8) this.cells[0].strength = 8;
                if (this.cells[1].strength > 8) this.cells[1].strength = 8;
                this.cells[0].use();
                clearInterval(battle_timer);
            }
            this.game.render();
        }, 1000);
    }
    trade()
    {
        // First cell is giver, second cell recieves, and third is trader location, fourth is trader destination, and extra info is amount of strength being traded
        let extra_amount = 0;
        if (this.cells[0].is_ore_deposit()) extra_amount++;
        if (this.cells[1].is_ore_deposit()) extra_amount++;
        extra_amount += this.extra_info[1]; 
        let return1 = this.cells[0].change_strength(-this.extra_info[0]-extra_amount, true);
        let return2 = this.cells[1].change_strength(this.extra_info[1], true);
        if (return1 == "clear" && return2 == "clear")
        {
            let unit = this.cells[2].save_unit();
            this.cells[2].remove_unit(false);
            this.cells[3].load_unit(unit);
            this.cells[3].use();
            return "clear";
        }
        else
        {
            if (return1 == "clear")
            {
                this.cells[0].change_strength(this.extra_info+extra_amount, true);
            }
            if (return2 == "clear")
            {
                this.cells[1].change_strength(-this.extra_info, true);
            }
            return "invalid";
        }
    }
}
class Game
{
    constructor(BOARD_ID, BOARD_WIDTH, BOARD_HEIGHT, BOARD_PIXEL_WIDTH, BOARD_PIXEL_HEIGHT, player_amount, option, player_array, INFO_ID, INFO_WIDTH, OBJECT_NAME, DO_ACTION_ID, END_TURN_ID, TURN_BUTTON_HEIGHT)
    {
        this.BOARD_ID = BOARD_ID;
        this.BOARD_WIDTH = BOARD_WIDTH;
        this.BOARD_HEIGHT = BOARD_HEIGHT;
        this.BOARD_PIXEL_WIDTH = BOARD_PIXEL_WIDTH;
        this.BOARD_PIXEL_HEIGHT = BOARD_PIXEL_HEIGHT;
        this.BOARD_CELL_PIXEL_WIDTH = BOARD_PIXEL_WIDTH/BOARD_WIDTH;
        this.BOARD_CELL_PIXEL_HEIGHT = BOARD_PIXEL_HEIGHT/BOARD_HEIGHT;
        this.OBJECT_NAME = OBJECT_NAME;
        this.INFO_WIDTH = INFO_WIDTH;
        this.TURN_BUTTON_HEIGHT = TURN_BUTTON_HEIGHT;
        this.selected_tile = [-1, -1];
        this.actions = [];
        this.player_amount = player_amount;
        this.player_turn = 0;
        this.player_array = player_array;
        this.html_board = document.getElementById(BOARD_ID);
        this.info = document.getElementById(INFO_ID);
        this.do_action_html = document.getElementById(DO_ACTION_ID);
        this.end_turn_html = document.getElementById(END_TURN_ID);
        this.info.style.width = INFO_WIDTH + "px";
        this.do_action_html.style.width = INFO_WIDTH + "px";
        this.end_turn_html.style.width = INFO_WIDTH + "px";
        this.info.style.left = (BOARD_PIXEL_WIDTH + 50) + "px";
        this.do_action_html.style.left = (BOARD_PIXEL_WIDTH + 50) + "px";
        this.end_turn_html.style.left = (BOARD_PIXEL_WIDTH + 50) + "px";
        this.info.style.height = BOARD_PIXEL_HEIGHT/2 + "px";
        this.do_action_html.style.height = TURN_BUTTON_HEIGHT + "px";
        this.end_turn_html.style.height = TURN_BUTTON_HEIGHT + "px";
        this.do_action_html.style.top = BOARD_PIXEL_HEIGHT/2+50 + "px";
        this.end_turn_html.style.top = BOARD_PIXEL_HEIGHT/2+95+TURN_BUTTON_HEIGHT + "px";
        this.do_action_html.setAttribute("onclick", OBJECT_NAME + ".do_all_actions()")
        this.end_turn_html.setAttribute("onclick", OBJECT_NAME + ".end_turn()")
        this.info.style.display = "none";
        this.selectable_tiles = [];
        this.action_in_progress;
        let map = [];
        for (let i = 0; i < BOARD_HEIGHT; i++)
        {
            map[i] = [];
            for (let j = 0; j < BOARD_WIDTH; j++)
            {
                map[i][j] = new Cell("none", "none", 0, -1);
            }
        }
        this.board = map;
        this.html_board.style.width = this.BOARD_PIXEL_WIDTH + "px";
        this.html_board.style.height = this.BOARD_PIXEL_HEIGHT + "px";
        this.set_map(BOARD_WIDTH, BOARD_HEIGHT, player_amount, option);
        this.get_tile([5, 2]).place_unit("navy", 3, 1, false);
        this.get_tile([5, 1]).place_unit("army", 5, 1, false);
        this.get_tile([5, 0]).place_unit("trader", 0, 0, false);
        this.get_tile([6, 1]).place_unit("blockade", 3, 0, false);
        this.get_tile([6, 2]).place_unit("city", 5, 0, false);
        this.get_tile([0, 0]).place_unit("city", 8, 2, false);
        this.get_tile([4, 4]).place_unit("city", 8, 2, false);
        this.get_tile([4, 3]).place_unit("navy", 1, 2, false);
        this.get_tile([0, 6]).place_unit("city", 1, 2, false);
        this.get_tile([0, 1]).place_unit("trader", 0, 2, false);
        this.unit_array = 
        [
            new Unit("navy", true, 5, ["water"], ["army", "blockade", "city"], ["transact", "build", "battle", "trade", "move"]),
            new Unit("army", true, 4, ["land", "soil"], ["blockade", "city"], ["transact", "build", "battle", "trade", "move"]),
            new Unit("city", true, 5, ["soil", "ore deposit"], ["army", "navy", "trader", "blockade", "city"], ["produce", "transact", "build", "battle", "trade"]),
            new Unit("blockade", false, 4, ["land"], [], ["remove"]),
            new Unit("trader", false, 3, ["land"], [], ["trade"])
        ];
        this.render();
    }
    reset_ui()
    {
        this.selectable_tiles = [];
        this.action_in_progress = "none";
    }
    end_turn()
    {
        for (let row of this.board)
        {
            for (let cell of row)
            {
                cell.action_state = "unused";
            }
        }
        this.reset_ui();
        this.actions = [];
        this.selected_tile = [-1, -1]
        this.update_turn();
        this.render();
    }
    give_direction(num)
    {
        if (num == 0) return "up";
        else if (num == 1) return "right";
        else if (num == 2) return "down";
        else if (num == 3) return "left";
    }
    cell_in_direction(direction, cell)
    {
        if (direction == "up" && cell[0] > 0) return [cell[0]-1, cell[1]];
        else if (direction == "right" && cell[1] < this.BOARD_WIDTH-1) return [cell[0], cell[1]+1];
        else if (direction == "down" && cell[0] < this.BOARD_HEIGHT-1) return [cell[0]+1, cell[1]];
        else if (direction == "left" && cell[1] > 0) return [cell[0], cell[1]-1];
        else return null;
    }
    get_surrounding_cells(distance, starting, available_tiles, exclude_staring)
    {
        let current_wave = [starting];
        let past_wave = [];
        
        this.get_tile(starting).visited = true;

        for (let current_distance = 0; current_distance < distance; current_distance++)
        {
            let next_wave = [];
            for (let cell of current_wave)
            {
                for (let i = 0; i < 4; i++)
                {
                    let direction = this.give_direction(i);
                    let next_cell = this.cell_in_direction(direction, cell);
                    if (next_cell == null) continue;

                    let tile = this.get_tile(next_cell);
                    if (!available_tiles.includes(tile.land_type) || tile.visited) continue;

                    tile.visited = true;
                    next_wave.push(next_cell);
                }
            }
            past_wave = past_wave.concat(current_wave);
            current_wave = next_wave;
        }
        past_wave = past_wave.concat(current_wave);
        for (let cell of past_wave)
        {
            this.get_tile(cell).visited = false;
        }
        if (exclude_staring)
        {
            let starting_index = past_wave.indexOf(starting);
            if (starting != -1)
            {
                past_wave.splice(starting_index, 1);
            }
        }
        return past_wave;
    }
    get_tile(coords)
    {
        return this.board[coords[0]][coords[1]];
    }
    get_selected_tile()
    {
        return this.board[this.selected_tile[0]][this.selected_tile[1]];
    }
    update_turn()
    {
        if (this.player_turn < this.player_amount-1) this.player_turn++;
        else this.player_turn = 0;
    }
    return_unit(name)
    {
        if (name == "navy") return this.unit_array[0];
        else if (name == "army") return this.unit_array[1];
        else if (name == "city") return this.unit_array[2];
        else if (name == "blockade") return this.unit_array[3];
        else if (name == "trader") return this.unit_array[4];
    }
    set_map(x, y, players, option)
    {
        let map_string = "";
        if (x == 7 && y == 7 && players == 3)
        {
            if (option == 1) map_string = "slllllollslllmllwwwlslmwwwwwlswwowwllwwwwwllswwww";
            else if (option == 2) map_string = "wwwswwwwwlllwwwlllllwwomsmowwlllllwwlllllwsllwlls";
        }
        else if (x == 5 && y == 5 && players == 2)
        {
            if (option == 1) map_string = "slllswllwwwwlwwwwllwsllls";
        }
        else if (x == 10 && y == 10 && players == 4)
        {
            if (option == 1) map_string = "sllllllwwwlllllswwwwllswwwwwwsllwwwwwwllwswwslwsllwwwwlllllllwwwwlommlswwwsllmollwwlllmlllwwslllllls";
        }
        for (let i = 0; i < this.BOARD_HEIGHT; i++)
        {
            for (let j = 0; j < this.BOARD_WIDTH; j++)
            {
                let c = map_string[i*this.BOARD_HEIGHT+j];
                let land_type;
                if (c == 'l') land_type = "land";
                else if (c == 'w') land_type = "water";
                else if (c == 's') land_type = "soil";
                else if (c == 'm') land_type = "mountain";
                else if (c == 'o') land_type = "ore deposit";
                this.board[i][j].land_type = land_type
            }
        }
    }
    land_type_to_color(type)
    {
        if (type == "land") return "chartreuse";
        else if (type == "water") return "deepskyblue";
        else if (type == "soil") return "red";
        else if (type == "mountain") return "white";
        else if (type == "ore deposit") return "grey";
        else return "black";
    }
    update_action_state()
    {
        for (let action of this.actions)
        {
            for (let cell of action.cells)
            {
                cell.action_state = "being used";
            }
        }
    }
    render()
    {
        this.update_action_state();
        let UNIT_RATIO  = [.8, .2];
        this.html_board.innerHTML = ""
        for (let i = 0; i < this.BOARD_HEIGHT; i++)
        {
            for (let j = 0; j < this.BOARD_WIDTH; j++)
            {
                this.html_board.innerHTML += "<div class='Cell' style='top: " + this.BOARD_CELL_PIXEL_HEIGHT*i + "px; left: " + this.BOARD_CELL_PIXEL_WIDTH*j +"px; height: " + (this.BOARD_CELL_PIXEL_HEIGHT-2) +"px; width: "+ (this.BOARD_CELL_PIXEL_WIDTH-2) + "px; background-color: " + this.land_type_to_color(this.board[i][j].land_type) + ";' id='" + i + "-" + j + "'></div>";
                this.html_board.innerHTML += "<div class='Cell' style='top: " + this.BOARD_CELL_PIXEL_HEIGHT*i + "px; left: " + this.BOARD_CELL_PIXEL_WIDTH*j +"px; height: " + (this.BOARD_CELL_PIXEL_HEIGHT-2) +"px; width: "+ (this.BOARD_CELL_PIXEL_WIDTH-2) + "px; background-color: rgba(0, 0, 0, 0);' id='" + i + "-" + j + "-tint'></div>";
                if (this.board[i][j].player != -1)
                {
                    if (this.board[i][j].unit_type == "navy")
                    {
                        let unit = document.createElement("div");
                        unit.classList.add("navy_outline");
                        unit.style.top = (this.BOARD_CELL_PIXEL_HEIGHT*i+this.BOARD_CELL_PIXEL_HEIGHT*.25) + "px";
                        unit.style.left = (this.BOARD_CELL_PIXEL_WIDTH*j+this.BOARD_CELL_PIXEL_WIDTH*.25) + "px";
                        unit.style.borderLeft = (this.BOARD_CELL_PIXEL_HEIGHT*.5)/2 + "px solid transparent";
                        unit.style.borderRight = (this.BOARD_CELL_PIXEL_HEIGHT*.5)/2 + "px solid transparent";
                        unit.style.borderBottom = (this.BOARD_CELL_PIXEL_WIDTH*.5) + "px solid " + this.board[i][j].return_border_color();
                        let inner_unit = document.createElement("div")
                        inner_unit.classList.add("navy")
                        inner_unit.style.top = this.BOARD_CELL_PIXEL_HEIGHT*UNIT_RATIO[1]/3 + "px";
                        inner_unit.style.left = -(this.BOARD_CELL_PIXEL_WIDTH)*UNIT_RATIO[0]/4 + "px";
                        inner_unit.style.borderLeft = (this.BOARD_CELL_PIXEL_HEIGHT*.5)/2*UNIT_RATIO[0] + "px solid transparent";
                        inner_unit.style.borderRight = (this.BOARD_CELL_PIXEL_HEIGHT*.5)/2*UNIT_RATIO[0] + "px solid transparent";
                        if (this.selected_tile[0] == i && this.selected_tile[1] == j)
                        {
                            inner_unit.style.borderBottom = (this.BOARD_CELL_PIXEL_WIDTH*.5)*UNIT_RATIO[0] + "px solid " + this.player_array[this.board[i][j].player].hover_color;
                        }
                        else inner_unit.style.borderBottom = (this.BOARD_CELL_PIXEL_WIDTH*.5)*UNIT_RATIO[0] + "px solid " + this.player_array[this.board[i][j].player].color;
                        inner_unit.innerHTML = "<p class='strength'>" + this.board[i][j].strength + "<p class='strength'>";
                        if (this.player_turn == this.board[i][j].player && (this.selected_tile[0] != i || this.selected_tile[1] != j))
                        {
                            inner_unit.setAttribute('onmouseenter', "this.style.borderBottomColor = '" + this.player_array[this.board[i][j].player].hover_color + "'");
                            inner_unit.setAttribute('onmouseleave', "this.style.borderBottomColor = '" + this.player_array[this.board[i][j].player].color + "'");
                        }
                        if (this.player_turn == this.board[i][j].player) inner_unit.setAttribute("onclick", this.OBJECT_NAME + ".change_selected_tile(" + i + ", " + j + ")")
                        unit.append(inner_unit);
                        this.html_board.append(unit);
                    }
                    else if (this.board[i][j].unit_type == "blockade")
                    {
                        let unit = document.createElement("div");
                        unit.classList.add(this.board[i][j].unit_type);
                        unit.style.top = (this.BOARD_CELL_PIXEL_HEIGHT*i) + "px";
                        unit.style.left = (this.BOARD_CELL_PIXEL_WIDTH*j) + "px";
                        unit.style.height = (this.BOARD_CELL_PIXEL_HEIGHT)*UNIT_RATIO[0] + "px";
                        unit.style.width = (this.BOARD_CELL_PIXEL_WIDTH)*UNIT_RATIO[0] + "px";
                        unit.style.border = ((this.BOARD_CELL_PIXEL_HEIGHT*.5+this.BOARD_CELL_PIXEL_WIDTH*.5)/2)*UNIT_RATIO[1] + "px solid " + this.board[i][j].return_border_color();
                        unit.style.backgroundColor = this.player_array[this.board[i][j].player].color;
                        if (this.selected_tile[0] == i && this.selected_tile[1] == j)
                        {
                            unit.style.backgroundColor = this.player_array[this.board[i][j].player].hover_color;
                        }
                        else unit.style.backgroundColor = this.player_array[this.board[i][j].player].color;
                        if (this.player_turn == this.board[i][j].player && (this.selected_tile[0] != i || this.selected_tile[1] != j))
                        {
                            unit.setAttribute('onmouseenter', "this.style.backgroundColor = '" + this.player_array[this.board[i][j].player].hover_color + "'");
                            unit.setAttribute('onmouseleave', "this.style.backgroundColor = '" + this.player_array[this.board[i][j].player].color + "'");
                        }
                        if (this.player_turn == this.board[i][j].player) unit.setAttribute("onclick", this.OBJECT_NAME + ".change_selected_tile(" + i + ", " + j + ")")
                        this.html_board.append(unit);
                    }
                    else
                    {
                        let unit = document.createElement("div");
                        unit.classList.add(this.board[i][j].unit_type);
                        unit.id = i + "-" + j + "-unit";
                        unit.style.top = (this.BOARD_CELL_PIXEL_HEIGHT*i+this.BOARD_CELL_PIXEL_HEIGHT*.25)-((this.BOARD_CELL_PIXEL_HEIGHT*.5+this.BOARD_CELL_PIXEL_WIDTH*.5)/2)*(UNIT_RATIO[1]/2) + "px";
                        unit.style.left = (this.BOARD_CELL_PIXEL_WIDTH*j+this.BOARD_CELL_PIXEL_WIDTH*.25)-((this.BOARD_CELL_PIXEL_HEIGHT*.5+this.BOARD_CELL_PIXEL_WIDTH*.5)/2)*(UNIT_RATIO[1]/2) + "px";
                        unit.style.height = (this.BOARD_CELL_PIXEL_HEIGHT*.5)*UNIT_RATIO[0] + "px";
                        unit.style.width = (this.BOARD_CELL_PIXEL_WIDTH*.5)*UNIT_RATIO[0] + "px";
                        unit.style.border = ((this.BOARD_CELL_PIXEL_HEIGHT*.5+this.BOARD_CELL_PIXEL_WIDTH*.5)/2)*UNIT_RATIO[1] + "px solid "+ this.board[i][j].return_border_color();
                        unit.style.backgroundColor = this.player_array[this.board[i][j].player].color;
                        if (this.board[i][j].unit_type == "city") unit.innerHTML = "<p class='strength' style='rotate: -45deg;'>" + this.board[i][j].strength + "</p class='strength'>";
                        else if (this.return_unit(this.board[i][j].unit_type).holds_strength) unit.innerHTML = "<p class='strength'>" + this.board[i][j].strength + "<p class='strength'>";
                        if (this.selected_tile[0] == i && this.selected_tile[1] == j)
                        {
                            unit.style.backgroundColor = this.player_array[this.board[i][j].player].hover_color;
                        }
                        else unit.style.backgroundColor = this.player_array[this.board[i][j].player].color;
                        if (this.player_turn == this.board[i][j].player && (this.selected_tile[0] != i || this.selected_tile[1] != j))
                        {
                            unit.setAttribute('onmouseenter', "this.style.backgroundColor = '" + this.player_array[this.board[i][j].player].hover_color + "'");
                            unit.setAttribute('onmouseleave', "this.style.backgroundColor = '" + this.player_array[this.board[i][j].player].color + "'");
                        }
                        if (this.player_turn == this.board[i][j].player) unit.setAttribute("onclick", this.OBJECT_NAME + ".change_selected_tile(" + i + ", " + j + ")")
                        this.html_board.append(unit);
                    }
                }
            }
        }
        for (let tile of this.selectable_tiles)
        {
            let real_tile = document.getElementById(tile[0] + "-" + tile[1] + "-tint");
            real_tile.style.backgroundColor = "rgba(0, 0, 0, .25)";
            real_tile.setAttribute('onmouseenter', "this.style.backgroundColor = 'rgba(0, 0, 0, .5)'");
            real_tile.setAttribute('onmouseleave', "this.style.backgroundColor = 'rgba(0, 0, 0, .25)'");
            real_tile.setAttribute('onclick', this.OBJECT_NAME + ".tile_selected(" + tile[0] + ", " + tile[1] + ")");
        }
        if (this.selected_tile[0] != -1 && this.selected_tile[1] !=-1 && this.get_selected_tile().player != -1)
        {
            this.info.style.display = "block";
            let unit_type = this.get_selected_tile().unit_type
            unit_type = unit_type[0].toUpperCase() + unit_type.slice(1);
            this.info.innerHTML = "<h1>" + unit_type + "</h1>";
            if (this.get_selected_tile().action_state != "used")
            {
                for (let action of this.return_unit(this.get_selected_tile().unit_type).actions)
                {
                    let button = document.createElement("button");
                    button.innerHTML = action;
                    button.classList.add("ActionButton");
                    button.style.width = this.INFO_WIDTH + "px";
                    button.style.height = this.BOARD_PIXEL_HEIGHT/20 + "px";
                    button.setAttribute("onclick", this.OBJECT_NAME +".ask_action('" + action + "')")
                    this.info.append(button);
                }
                if (this.get_selected_tile().action_state == "being used")
                {
                    let button = document.createElement("button");
                    button.innerHTML = "Cancel Action";
                    button.classList.add("CancelActionButton");
                    button.style.width = this.INFO_WIDTH + "px";
                    button.style.height = this.BOARD_PIXEL_HEIGHT/20 + "px";
                    button.setAttribute("onclick", this.OBJECT_NAME +".ask_action('cancel action')")
                    this.info.append(button);
                }
            }
            
        }
        else
        {
            this.info.style.display = "none";
        }
    }
    change_selected_tile(i, j)
    {
        if (this.selected_tile[0] != i || this.selected_tile[1] != j) this.selected_tile = [i, j];
        else this.selected_tile = [-1, -1];
        this.selectable_tiles = [];
        this.render();
    }
    do_all_actions()
    {
        for (let action of this.actions)
        {
            console.log(action.do_action());
            for (let cell of action.cells)
            {
                if (cell.action_state == "being used") cell.action_state = "unused";
            }
        }
        this.reset_ui();
        this.actions = [];
        this.render();
    }
    search_for_action(specific_cell)
    {
        for (let i = 0; i < this.actions.length; i++)
        {
            let action = this.actions[i];
            for (let cell of action.cells)
            {
                if (cell === specific_cell) return i;
            }
        }
        return null;
    }
    tile_selected(i, j)
    {
        console.log("Here");
        let tile = [i, j];
        if (this.action_in_progress == "move")
        {
            let action = new Action([this.get_selected_tile(), this.get_tile(tile)], "move", "none", this);
            this.actions.push(action);
            this.reset_ui();
            this.render();
        }
    }
    ask_action(action_name)
    {
        if (this.get_selected_tile().action_state == "being used")
        {
            let old_action = this.search_for_action(this.get_selected_tile());
            if (old_action !== null)
            {
                for (let cell of this.actions[old_action].cells)
                {
                    cell.action_state = "unused";
                }
                this.actions.splice(old_action, 1);
                this.render();
            }
        }
        if (action_name == "produce")
        {
            let action = new Action([this.get_selected_tile()], "produce", "none", this);
            this.actions.push(action);
        }
        else if (action_name == "remove")
        {
            let action = new Action([this.get_selected_tile()], "remove", "none", this);
            this.actions.push(action);
        }
        else if (action_name == "move")
        {
            let tiles = this.get_surrounding_cells(1, this.selected_tile, this.return_unit(this.get_selected_tile().unit_type).available_tiles, true);
            for (let i = 0; i < tiles.length; i++)
            {
                let tile = tiles[i];
                if (this.get_tile(tile).unit_type != "none")
                {
                    tiles.splice(i, 1);
                    if (tiles.length > 0) i--;
                }
            }
            this.action_in_progress = action_name;
            this.selectable_tiles = tiles;
        }
        this.render();
    }
}

let player = new Player("blue", "dodgerblue");
let player2 = new Player("red", "pink");
let player3 = new Player("forestgreen", "lawngreen")
let game = new Game("Board", 7, 7, 1000, 1000, 3, 1, [player, player2, player3], "Info", 400, "game", "DoAction", "EndTurn", 100);

run_tests();
function run_tests()
{
    console.log(game.get_surrounding_cells(6, [3, 3], ["land", "soil", "water", "mountain", "ore deposit"], true))
    game.render();
}