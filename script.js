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
    constructor(color, hover_color, name)
    {
        this.color = color;
        this.hover_color = hover_color;
        this.is_dead = false;
        this.name = name;
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
        if (this.visited) return "white";
        else if (this.action_state == "unused") return "black";
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
            if (this.cells[0].strength == 0) this.cells[0].remove_unit(false);
            if (this.cells[1].strength == 0) this.cells[1].remove_unit(false);
            return "clear";
        }
        else
        {
            if (return1 == "clear")
            {
                this.cells[0].change_strength(this.extra_info+extra_amount, true);
                this.cells[0].action_state = "unused";
            }
            if (return2 == "clear")
            {
                this.cells[1].change_strength(-this.extra_info, true);
                this.cells[1].action_state = "unused";
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
            if (this.cells[0].strength == 0) this.cells[0].remove_unit(false);
            if (this.cells[1].strength == 0) this.cells[1].remove_unit(false);
            return "clear";
        }
        else return "invalid";
    }
    battle()
    {
        if (this.cells[0].land_type == "ore deposit") this.cells[0].strength += 2;
        if (this.cells[1].land_type == "ore deposit") this.cells[1].strength += 2;
        if (this.cells[1].unit_type == "trader" || this.cells[1].unit_type == "blockade")
        {
            let return1 = this.cells[0].change_strength(-2, false);
            if (return1 != "clear") return "invalid";
            else
            {
                this.cells[0].use();
                if (this.cells[0].strength > 8) this.cells[0].strength = 8;
                if (this.cells[1].strength > 8) this.cells[1].strength = 8;
                this.cells[1].remove_unit(false);
                if (this.cells[0].strength == 0) this.cells[0].remove_unit(false);
                return "clear";
            }
        }
        else
        {
            let battle_timer = setInterval(() => 
            {
                game.battling = true;
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
                    game.battling = false;
                }
                if (this.cells[1].strength <= 0)
                {
                    this.cells[1].remove_unit(false);
                    if (this.cells[0].strength > 8) this.cells[0].strength = 8;
                    if (this.cells[1].strength > 8) this.cells[1].strength = 8;
                    this.cells[0].use();
                    clearInterval(battle_timer);
                    game.battling = false;
                }
                this.game.render();
            }, 1000);
        }
    }
    trade()
    {
        // First cell is giver, second cell recieves, and third is trader location, fourth is trader destination, and extra info is amount of strength being traded
        let extra_amount = 0;
        if (this.cells[0].is_ore_deposit()) extra_amount++;
        if (this.cells[1].is_ore_deposit()) extra_amount++; 
        let return1 = this.cells[0].change_strength(-this.extra_info[0]-extra_amount-this.extra_info[1], true);
        let return2 = this.cells[1].change_strength(this.extra_info[1], true);
        if (return1 == "clear" && return2 == "clear")
        {
            let unit = this.cells[2].save_unit();
            this.cells[2].remove_unit(false);
            this.cells[3].load_unit(unit);
            this.cells[3].use();
            if (this.cells[0].strength == 0) this.cells[0].remove_unit(false);
            if (this.cells[1].strength == 0) this.cells[1].remove_unit(false);
            return "clear";
        }
        else
        {
            if (return1 == "clear")
            {
                this.cells[0].change_strength(this.extra_info[1]+extra_amount+this.extra_info[0], true);
            }
            if (return2 == "clear")
            {
                this.cells[1].change_strength(-this.extra_info[1], true);
            }
            return "invalid";
        }
    }
}
class Game
{
    constructor(BOARD_ID, BOARD_WIDTH, BOARD_HEIGHT, BOARD_PIXEL_WIDTH, BOARD_PIXEL_HEIGHT, player_amount, MAP_STRING, player_array, INFO_ID, INFO_WIDTH, OBJECT_NAME, DO_ACTION_ID, END_TURN_ID, DIALOGUE_BOX_ID, TURN_BUTTON_HEIGHT)
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
        this.dialogue_box_html = document.getElementById(DIALOGUE_BOX_ID);
        this.info.style.width = INFO_WIDTH + "px";
        this.do_action_html.style.width = INFO_WIDTH + "px";
        this.end_turn_html.style.width = INFO_WIDTH + "px";
        this.dialogue_box_html.style.width = INFO_WIDTH + "px";
        this.info.style.left = (BOARD_PIXEL_WIDTH + 50) + "px";
        this.do_action_html.style.left = (BOARD_PIXEL_WIDTH + 50) + "px";
        this.end_turn_html.style.left = (BOARD_PIXEL_WIDTH + 50) + "px";
        this.dialogue_box_html.style.left = (BOARD_PIXEL_WIDTH + 50) + "px";
        this.info.style.height = BOARD_PIXEL_HEIGHT/2 + "px";
        this.do_action_html.style.height = TURN_BUTTON_HEIGHT + "px";
        this.end_turn_html.style.height = TURN_BUTTON_HEIGHT + "px";
        this.dialogue_box_html.style.height = TURN_BUTTON_HEIGHT + "px";
        this.do_action_html.style.top = BOARD_PIXEL_HEIGHT/2+50 + "px";
        this.end_turn_html.style.top = BOARD_PIXEL_HEIGHT/2+95+TURN_BUTTON_HEIGHT + "px";
        this.dialogue_box_html.style.top = BOARD_PIXEL_HEIGHT/2+140+TURN_BUTTON_HEIGHT*2 + "px";
        this.do_action_html.setAttribute("onclick", OBJECT_NAME + ".do_all_actions()")
        this.end_turn_html.setAttribute("onclick", OBJECT_NAME + ".end_turn()")
        this.info.style.display = "none";

        this.selectable_tiles = [];
        this.action_in_progress;
        this.battling = false;

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
        this.set_map(MAP_STRING);
        // this.get_tile([5, 2]).place_unit("navy", 3, 1, false);
        // this.get_tile([5, 1]).place_unit("army", 1, 1, false);
        // this.get_tile([5, 0]).place_unit("blockade", 0, 0, false);
        // this.get_tile([6, 1]).place_unit("blockade", 3, 0, false);
        // this.get_tile([6, 2]).place_unit("city", 5, 0, false);
        // this.get_tile([0, 0]).place_unit("city", 8, 2, false);
        // this.get_tile([4, 4]).place_unit("city", 8, 2, false);
        // this.get_tile([4, 3]).place_unit("navy", 1, 2, false);
        // this.get_tile([0, 6]).place_unit("city", 1, 2, false);
        // this.get_tile([0, 1]).place_unit("trader", 0, 2, false);
        // this.get_tile([3, 0]).place_unit("trader", 0, 0, false);
        // this.get_tile([2, 0]).place_unit("army", 4, 2, false);
        // this.get_tile([1, 5]).place_unit("army", 4, 2, false);
        // this.get_tile([0, 3]).place_unit("army", 4, 1, false);
        this.action_extra = "";
        this.unit_array = 
        [
            new Unit("navy", true, 5, ["water"], ["army", "blockade", "city"], ["transact", "build", "battle", "trade", "move"]),
            new Unit("army", true, 4, ["land", "soil"], ["blockade", "city"], ["transact", "build", "battle", "trade", "move"]),
            new Unit("city", true, 5, ["soil", "ore deposit"], ["army", "navy", "trader", "blockade", "city"], ["produce", "transact", "build", "battle", "trade"]),
            new Unit("blockade", false, 4, ["land"], [], ["remove"]),
            new Unit("trader", false, 3, ["land", "soil"], [], ["move"])
        ];
        this.render();
    }
    reset_ui()
    {
        this.selectable_tiles = [];
        this.action_in_progress = "none";
        this.action_info = [];
        this.action_extra = "";
        for (let row of this.board)
        {
            for (let cell of row)
            {
                cell.visited = false;
            }
        }
    }
    end_game()
    {
        this.html_board.remove();
        this.info.remove();
        this.end_turn_html.remove();
        this.do_action_html.remove();
        this.dialogue_box_html.remove();
        let name;
        for (let player of this.player_array)
        {
            if (!player.is_dead)
            {
                name = player.name;
                break;
            }
        }
        alert(name + " has won!")
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
        if (this.update_players()) this.end_game();
        {
            this.update_turn();
            this.render();
        }
    }
    update_players()
    {
        let players_alive = 0;
        for (let player of this.player_array)
        {
            if (player.is_dead) continue;
            else
            {
                let done = false;
                for (let i = 0; i < this.BOARD_HEIGHT && !done; i++)
                {
                    for (let j = 0; j < this.BOARD_WIDTH && !done; j++)
                    {
                        if (this.player_array[this.board[i][j].player] == player && this.board[i][j].unit_type == "city") done = true;
                    }
                }
                if (!done)
                {
                    for (let i = 0; i < this.BOARD_HEIGHT && !done; i++)
                    {
                        for (let j = 0; j < this.BOARD_WIDTH && !done; j++)
                        {
                            if (this.player_array[this.board[i][j].player] == player)
                            {
                                this.board[i][j].remove_unit(false);
                            }
                        }
                    }
                    player.is_dead = true;
                }
                else
                {
                    players_alive++;
                }
            }
        }
        if (players_alive == 1) return true;
        return false;
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
        let is_trader = false;
        if (available_tiles.includes("trader")) is_trader = true;
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
                    if (is_trader)
                    {
                        if (tile.unit_type != "none" && tile.unit_type != "trader" && this.get_tile(starting).player != tile.player) continue;
                    }
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
        while (true)
        {
            if (this.player_turn < this.player_amount-1) this.player_turn++;
            else this.player_turn = 0;
            if (!this.player_array[this.player_turn].is_dead) break;
        }
    }
    return_unit(name)
    {
        if (name == "navy") return this.unit_array[0];
        else if (name == "army") return this.unit_array[1];
        else if (name == "city") return this.unit_array[2];
        else if (name == "blockade") return this.unit_array[3];
        else if (name == "trader") return this.unit_array[4];
    }
    set_map(map_string)
    {
        // let map_string = "";
        // if (x == 7 && y == 7 && players == 3)
        // {
        //     if (option == 1) map_string = "slllllollslllmllwwwlslmwwwwwlswwowwllwwwwwllswwww";
        //     else if (option == 2) map_string = "wwwswwwwwlllwwwlllllwwomsmowwlllllwwlllllwsllwlls";
        // }
        // else if (x == 5 && y == 5 && players == 2)
        // {
        //     if (option == 1) map_string = "slllswllwwwwlwwwwllwsllls";
        // }
        // else if (x == 10 && y == 10 && players == 4)
        // {
        //     if (option == 1) map_string = "sllllllwwwlllllswwwwllswwwwwwsllwwwwwwllwswwslwsllwwwwlllllllwwwwlommlswwwsllmollwwlllmlllwwslllllls";
        // }
        let offset = 0;
        for (let i = 0; i < this.BOARD_HEIGHT; i++)
        {
            for (let j = 0; j < this.BOARD_WIDTH; j++)
            {
                let number = parseInt(map_string.slice([i*this.BOARD_HEIGHT+j+offset]), 10);
                if (!Number.isNaN(number))
                {
                    let digits = String(Math.abs(number)).length;
                    offset += digits+1;
                    let unit_character = map_string[i*this.BOARD_HEIGHT+j+offset-1];
                    let unit;
                    if (unit_character == "c") unit = "city";
                    else if (unit_character == "a") unit = "army";
                    else if (unit_character == "n") unit = "navy";
                    this.board[i][j].place_unit(unit, 3, number, false);
                }

                let c = map_string[i*this.BOARD_HEIGHT+j+offset];
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
                        if ((this.player_turn == this.board[i][j].player || this.board[i][j].visited) && (this.selected_tile[0] != i || this.selected_tile[1] != j))
                        {
                            inner_unit.setAttribute('onmouseenter', "this.style.borderBottomColor = '" + this.player_array[this.board[i][j].player].hover_color + "'");
                            inner_unit.setAttribute('onmouseleave', "this.style.borderBottomColor = '" + this.player_array[this.board[i][j].player].color + "'");
                        }
                        if (this.board[i][j].visited) unit.setAttribute("onclick", this.OBJECT_NAME + ".tile_selected(" + i + ", " + j + ")")
                        else if (this.player_turn == this.board[i][j].player) inner_unit.setAttribute("onclick", this.OBJECT_NAME + ".change_selected_tile(" + i + ", " + j + ")")
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
                        if ((this.player_turn == this.board[i][j].player || this.board[i][j].visited) && (this.selected_tile[0] != i || this.selected_tile[1] != j))
                        {
                            unit.setAttribute('onmouseenter', "this.style.backgroundColor = '" + this.player_array[this.board[i][j].player].hover_color + "'");
                            unit.setAttribute('onmouseleave', "this.style.backgroundColor = '" + this.player_array[this.board[i][j].player].color + "'");
                        }
                        if (this.player_turn == this.board[i][j].player) unit.setAttribute("onclick", this.OBJECT_NAME + ".change_selected_tile(" + i + ", " + j + ")")
                        if (this.board[i][j].visited) unit.setAttribute("onclick", this.OBJECT_NAME + ".tile_selected(" + i + ", " + j + ")")
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
                        if ((this.player_turn == this.board[i][j].player || this.board[i][j].visited) && (this.selected_tile[0] != i || this.selected_tile[1] != j))
                        {
                            unit.setAttribute('onmouseenter', "this.style.backgroundColor = '" + this.player_array[this.board[i][j].player].hover_color + "'");
                            unit.setAttribute('onmouseleave', "this.style.backgroundColor = '" + this.player_array[this.board[i][j].player].color + "'");
                        }
                        if (this.player_turn == this.board[i][j].player) unit.setAttribute("onclick", this.OBJECT_NAME + ".change_selected_tile(" + i + ", " + j + ")")
                        if (this.board[i][j].visited) unit.setAttribute("onclick", this.OBJECT_NAME + ".tile_selected(" + i + ", " + j + ")")
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
        if (this.selected_tile[0] != -1 && this.selected_tile[1] !=-1 && this.get_selected_tile().player != -1 && !this.battling)
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
        for (let row of this.board)
        {
            for (let cell of row)
            {
                cell.visited = false;
            }
        }
        this.render();
    }
    do_all_actions()
    {
        this.dialogue_box_html.innerHTML = "";
        for (let action of this.actions)
        {
            this.dialogue_box_html.innerHTML += action.do_action() + "<br>";
            for (let cell of action.cells)
            {
                if (action.action_name == "battle")
                {
                    if (action.cells[1].unit_type == "trader" || action.cells[1].unit_type == "blockade") cell.action_state = "unused";
                }
                else if (cell.action_state == "being used") cell.action_state = "unused";
            }
        }
        setTimeout(() => 
        {
            this.dialogue_box_html.innerHTML = "";
        }, 2000);
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
        else if (this.action_in_progress == "battle")
        {
            let action = new Action([this.get_selected_tile(), this.get_tile(tile)], "battle", "none", this);
            this.actions.push(action);
            this.reset_ui();
            this.render();
        }
        else if (this.action_in_progress == "transact")
        {
            let transact_number = prompt("How much strength would you like to input?");
            if (transact_number !== null)
            {
                transact_number = Number(transact_number);
                if (Number.isInteger(!Number.isNaN(transact_number) && transact_number))
                {
                    let action = new Action([this.get_selected_tile(), this.get_tile(tile)], "transact", transact_number, this);
                    this.actions.push(action);
                    this.reset_ui();
                    this.render();
                }
            }
        }
        else if (this.action_in_progress == "build")
        {
            let action = new Action([this.get_selected_tile(), this.get_tile(tile)], "build", [this.action_extra, this.return_unit(this.action_extra).cost, this.get_selected_tile().player], this);
            this.actions.push(action);
            this.reset_ui();
            this.render();
        }
        else if (this.action_in_progress == "trade")
        {
            console.log("Here2");
            let unit_tiles = this.get_surrounding_cells(1, tile, ["land", "soil", "water", "mountain", "ore deposit"], true);
            console.log(unit_tiles);
            let in_use_tiles = this.get_action_cells();
            for (let i = 0; i < unit_tiles.length; i++)
            {
                let unit_tile = unit_tiles[i];
                if (this.get_tile(unit_tile).unit_type == "none" || in_use_tiles.includes(this.get_tile(unit_tile)) || this.get_tile(this.action_extra).player != this.get_tile(unit_tile).player)
                {
                    console.log("Removing");
                    unit_tiles.splice(i, 1);
                    if (unit_tiles.length > 0) i--;
                }
            }
            let trading_cell;
            if (unit_tiles.length == 0) return;
            else if (unit_tiles.length == 1) trading_cell = unit_tiles[0];
            else if (unit_tiles.length > 1)
            {
                let answer;
                while (true)
                {
                    let text = "What direction unit do you want?";
                    let available_directions = [];
                    for (let unit_tile of unit_tiles)
                    {
                        text += "\n" + this.find_direction(tile, unit_tile);
                        available_directions.push(this.find_direction(tile, unit_tile));
                    }
                    answer = prompt(text);
                    if (available_directions.includes(answer)) break;
                }
                trading_cell = this.cell_in_direction(answer, tile);
            }
            console.log("Here3")
            let distance = 0;
            while (true)
            {
                distance++;
                let fake_tiles = this.get_surrounding_cells(distance, trading_cell, ["land", "soil", "trader"], true);
                let found = false;
                for (let fake_tile of fake_tiles)
                {
                    if (this.action_extra[0] == fake_tile[0] && this.action_extra[1] == fake_tile[1])
                    {
                        console.log(fake_tiles);
                        found = true;
                        break;
                    }
                }
                if (found) break;
                // let found = fake_tiles.some(tile =>
                //     tile[0] === this.action_extra[0] && tile[1] === this.action_extra[1]
                // );

                // if (found) break;
                // if (distance > this.BOARD_WIDTH + this.BOARD_HEIGHT) break;
            }
            console.log(distance);
            console.log(this.action_extra);
            distance--;
            let extra_amount = 0;
            if (distance % 3 != 0) extra_amount = 1; 
            let cost = Math.trunc(distance / 3)+extra_amount;
            let transact_number = prompt("How much strength would you like to input? The cost is already: " + cost);
            if (transact_number !== null)
            {
                transact_number = Number(transact_number);
                if (Number.isInteger(!Number.isNaN(transact_number) && transact_number))
                {
                    let action = new Action([this.get_selected_tile(), this.get_tile(trading_cell), this.get_tile(this.action_extra), this.get_tile(tile)], "trade", [cost, transact_number], this);
                    this.actions.push(action);
                    this.reset_ui();
                    this.render();
                }
            }
        }
    }
    get_action_cells()
    {
        let cells = [];
        for (let action of this.actions)
        {
            for (let cell of action.cells)
            {
                cells.push(cell);
            }
        }
        return cells;
    }
    find_direction(starting, next)
    {
        if (next[0] > starting[0]) return "down";
        else if (next[0] < starting[0]) return "up";
        else if (next[1] < starting[1]) return "left";
        else if (next[1] > starting[1]) return "right";
    }
    ask_action(action_name)
    {
        this.reset_ui();
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
            let tiles = [];
            if (this.get_selected_tile().unit_type != "trader") tiles = this.get_surrounding_cells(1, this.selected_tile, this.return_unit(this.get_selected_tile().unit_type).available_tiles, true);
            else
            {
                tiles = this.get_surrounding_cells(3, this.selected_tile, this.return_unit(this.get_selected_tile().unit_type).available_tiles, true);
            }
            let in_use_tiles = this.get_action_cells();
            for (let i = 0; i < tiles.length; i++)
            {
                let tile = tiles[i];
                if (this.get_tile(tile).unit_type != "none" || in_use_tiles.includes(this.get_tile(tile)) || (this.get_selected_tile().unit_type == "trader" && this.get_tile(tile).land_type == "soil"))
                {
                    tiles.splice(i, 1);
                    if (tiles.length > 0) i--;
                }
            }
            this.action_in_progress = action_name;
            this.selectable_tiles = tiles;
        }
        else if (action_name == "battle")
        {
            let tiles = this.get_surrounding_cells(1, this.selected_tile, ["land", "soil", "water", "mountain", "ore deposit"], true);
            let in_use_tiles = this.get_action_cells();
            for (let i = 0; i < tiles.length; i++)
            {
                let tile = tiles[i];
                if (this.get_tile(tile).unit_type == "none" || this.get_selected_tile().player == this.get_tile(tile).player || in_use_tiles.includes(this.get_tile(tile)))
                {
                    tiles.splice(i, 1);
                    if (tiles.length > 0) i--;
                }
                else
                {
                    this.get_tile(tile).visited = true;
                }
            }
            this.action_in_progress = "battle";
        }
        else if (action_name == "transact")
        {
            let tiles = this.get_surrounding_cells(1, this.selected_tile, ["land", "soil", "water", "mountain", "ore deposit"], true);
            let in_use_tiles = this.get_action_cells();
            for (let i = 0; i < tiles.length; i++)
            {
                let tile = tiles[i];
                if (this.get_tile(tile).unit_type == "none" || this.get_selected_tile().player != this.get_tile(tile).player || !this.return_unit(this.get_tile(tile).unit_type).holds_strength || in_use_tiles.includes(this.get_tile(tile)))
                {
                    tiles.splice(i, 1);
                    if (tiles.length > 0) i--;
                }
                else
                {
                    this.get_tile(tile).visited = true;
                }
            }
            this.action_in_progress = "transact";
        }
        else if (action_name == "trade")
        {
            let unit_tiles = this.get_surrounding_cells(1, this.selected_tile, ["land", "soil", "water", "mountain", "ore deposit"], true);
            let in_use_tiles = this.get_action_cells();
            for (let i = 0; i < unit_tiles.length; i++)
            {
                let unit_tile = unit_tiles[i];
                if (this.get_tile(unit_tile).unit_type != "trader" || in_use_tiles.includes(this.get_tile(unit_tile)) || this.get_selected_tile().player != this.get_tile(unit_tile).player)
                {
                    unit_tiles.splice(i, 1);
                    if (unit_tiles.length > 0) i--;
                }
            }
            let trading_cell;
            if (unit_tiles.length == 0) return;
            else if (unit_tiles.length == 1) trading_cell = unit_tiles[0];
            else if (unit_tiles.length > 1)
            {
                let answer;
                while (true)
                {
                    let text = "What direction trader do you want?";
                    let available_directions = [];
                    for (let tile of unit_tiles)
                    {
                        text += "\n" + this.find_direction(this.selected_tile, tile);
                        available_directions.push(this.find_direction(this.selected_tile, tile));
                    }
                    answer = prompt(text);
                    if (available_directions.includes(answer)) break;
                }
                trading_cell = this.cell_in_direction(answer, this.selected_tile);
            }
            let tiles = this.get_surrounding_cells(this.get_selected_tile().strength*3, trading_cell, ["land", "soil", "trader"], true);
            for (let i = 0; i < tiles.length; i++)
            {
                let tile = tiles[i];
                let surrounding_the_tile = this.get_surrounding_cells(1, tile, ["land", "soil", "water", "mountain", "ore deposit"], true);
                let same_team = false;
                for (let the_tile of surrounding_the_tile)
                {
                    if (this.get_tile(the_tile).player == this.get_tile(trading_cell).player && this.return_unit(this.get_tile(the_tile).unit_type).holds_strength)
                    {
                        console.log("Breaking");
                        same_team = true;
                        break;
                    }
                }
                if (this.get_tile(tile).land_type == "soil" || (this.get_tile(tile).player != -1 && this.get_tile(tile).player != this.get_tile(trading_cell).player) || in_use_tiles.includes(this.get_tile(tile)) || !same_team)
                {
                    console.log("Removing")
                    tiles.splice(i, 1);
                    if (tiles.length > 0) i--;
                }
            }
            console.log(tiles);
            this.action_in_progress = action_name;
            this.selectable_tiles = tiles;
            this.action_extra = trading_cell;
        }
        else if (action_name == "build")
        {
            let available_to_build = this.return_unit(this.get_selected_tile().unit_type).able_build;
            let text = "";
            for (let i = 0; i < available_to_build.length; i++)
            {
                text += "\n";
                text += String(i+1);
                text += ". ";
                text += available_to_build[i];
                text += " - ";
                text += this.return_unit(available_to_build[i]).cost;
            }
            let unit_to_build = prompt("What do you want to build? Write the unit" + text);
            if (available_to_build.includes(unit_to_build))
            {
                let tiles = [];
                if (unit_to_build != "blockade") tiles = this.get_surrounding_cells(1, this.selected_tile, this.return_unit(unit_to_build).available_tiles, true);
                else
                {
                    for (let i = 0; i < this.BOARD_HEIGHT; i++)
                    {
                        for (let j = 0; j < this.BOARD_WIDTH; j++)
                        {
                            if (this.return_unit("blockade").available_tiles.includes(this.get_tile([i, j]).land_type))
                            {
                                tiles.push([i, j]);
                            }
                        }
                    }
                }
                let in_use_tiles = this.get_action_cells();
                console.log(tiles);
                for (let i = 0; i < tiles.length; i++)
                {
                    let tile = tiles[i];
                    if (this.get_tile(tile).unit_type != "none" || in_use_tiles.includes(this.get_tile(tile)))
                    {
                        tiles.splice(i, 1);
                        if (tiles.length > 0) i--;
                    }
                }
                this.action_in_progress = "build";
                this.action_extra = unit_to_build;
                this.selectable_tiles = tiles;
            }
        }
        this.render();
    }
}

class Board
{
    constructor(map_string, width, height, players, image_path, name)
    {
        this.map_string = map_string;
        this.width = width;
        this.height = height;
        this.players = players;
        this.image_path = image_path
        this.name = name;
    }
}
// let player = new Player("blue", "dodgerblue", "blue");
// let player2 = new Player("red", "pink", "red");
// let player3 = new Player("forestgreen", "lawngreen", "green")
// let game = new Game("Board", 7, 7, 1000, 1000, 3, "0cs0alllllollslllmllwww1al1cslmwwwwwlswwowwllwwwwwl2al2cswwww", [player, player2, player3], "Info", 400, "game", "DoAction", "EndTurn", "DialogueBox", 100);

// run_tests();
// function run_tests()
// {
//     console.log(game.get_surrounding_cells(6, [3, 3], ["land", "soil", "water", "mountain", "ore deposit"], true))
//     game.render();
// }

function quick_darken(hex, percent)
{
  const num = parseInt(hex.replace("#",""), 16);
  const amt = Math.round(2.55 * percent);
  
  const R = (num >> 16) - amt;
  const G = (num >> 8 & 0x00FF) - amt;
  const B = (num & 0x0000FF) - amt;
  
  return "#" + (0x1000000 + (R < 0 ? 0 : R) * 0x10000 + (G < 0 ? 0 : G) * 0x100 + (B < 0 ? 0 : B)).toString(16).slice(1);
}

let game;

function start_game(board)
{
    let entering_players = [];
    for (let i = 0; i < player_id_num; i++)
    {
        let name = document.getElementById("player_name-" + i);
        if (name != null)
        {
            let color = document.getElementById("color-" + i);
            entering_players.push(new Player(color.value, quick_darken(color.value, 30), name.value));
        }
    }
    console.log(entering_players);
    body.innerHTML = "<div id='Board'></div><div id='Info'></div> <button id='DoAction'>Do Action</button> <button id='EndTurn'>End Turn</button> <button id='DialogueBox'></button>";
    game = new Game("Board", board.width, board.height, 1000, 1000, board.players, board.map_string, entering_players, "Info", 400, "game", "DoAction", "EndTurn", "DialogueBox", 100);
}

let boards = [];
boards.push(new Board("0cs0alllllollslllmllwww1al1cslmwwwwwlswwowwllwwwwwl2al2cswwww", 7, 7, 3, "Images/board_images/TheHarbor.png", "The Harbor"))
boards.push(new Board("www0cswwwwwl0allwwwlllllwwomsmowwlllllwwlllllw1cs1allwl2al2cs", 7, 7, 3, "Images/board_images/triangle.png", "Triangle"))
boards.push(new Board("0cs0alllswllwwwwlwwwwllwsll1al1cs", 5, 5, 2, "Images/board_images/Isthmus.png", "Isthmus"));
boards.push(new Board("0cs0allllllwwwlllllswwwwllswwwwww1csllwwwwwwl1alwswwslwsllwwwwlllllllwwwwlomml2cs2nwwwsllmollwwlllmlllwwslllll3al3cs", 10, 10, 4, "Images/board_images/Continental.png", "Continental"));
boards.push(new Board("wwwwwl0cowllwsl0alwllwwll1cs1allswmlwllwwllwllwsllwwwww2al2co", 7, 7, 3, "/Users/aharshiroy/Documents/Armies/Images/board_images/Channel.png", "Channel"));
boards.push(new Board("llllllolswl0allllwww0csllllwwwwlolwwwllllwwwsll1al1cswwwl", 7, 7, 2, "Images/board_images/Bay.png", "Bay"));
let body = document.body;
let player_amount_global = 0;
let player_id_num = 0;
function make_new_game()
{
    body.innerHTML = "<h1 style='text-align: left; font-size: 100pt;'>New Game</h1> <h2 style='font-size: 50pt;'>Players</h2> <div id='players'></div> <button class='MenuButton' onclick='add_player()'>Add Player</button> <br> <br> <label class='label_style' for='width'>Enter width:</label> <input type='number' min='1' step='1' inputmode='numeric' oninput=\"this.value = this.value.replace(/[^0-9]/g, '').replace(/^0+/, '');\" id='width' name='width'> <br> <br> <label class='label_style' for='height'>Enter height:</label> <input type='number' min='1' step='1' inputmode='numeric' oninput=\"this.value = this.value.replace(/[^0-9]/g, '').replace(/^0+/, '');\" id='height' name='height'> <br> <br> <button class='MenuButton' style='width: 200px; height: 100px;'' onclick='search_boards()'>Search boards</button> <br> <div id='boards'>";
    body.style.textAlign = "left";
}

function add_player()
{
    player_amount_global++;
    let players = document.getElementById("players");
    let player = document.createElement("div");
    player.classList.add("MenuDiv");
    player.style.width = 600 + "px";
    player.innerHTML += "<label class='label_style' for='player_name'>Enter name:</label> <input type='text' id='player_name" + "-" + player_id_num + "' name='username'> <br> <label class='label_style' for='color'>Choose a color:</label><input type='color' id='color" + "-" + player_id_num + "' name='color' value='red'>";
    player_id_num++;
    let button = document.createElement("button");
    button.classList.add("delete")
    button.innerHTML = "x";
    button.setAttribute("onclick", "remove_player(this)")
    player.append(button);
    players.append(player);
    search_boards();
}

function remove_player(element)
{
    player_amount_global--;
    element.parentElement.remove();
    search_boards();
}

function search_boards()
{
    console.log("Here");
    let width = parseInt(document.getElementById("width").value);
    let height = parseInt(document.getElementById("height").value);
    console.log(width);
    console.log(height);
    console.log(player_amount_global);
    let can_pass = [false, false, false];
    if (Number.isNaN(width)) can_pass[0] = true;
    if (Number.isNaN(height)) can_pass[1] = true;
    let available_boards = [];
    for (let board of boards)
    {
        if ((board.width == width || can_pass[0]) && (board.height == height || can_pass[1]) && board.players == player_amount_global) available_boards.push(board);
    }

    let boards_html = document.getElementById("boards");
    boards_html.innerHTML = "";
    for (let board of available_boards)
    {
        let board_info = document.createElement("button");
        board_info.classList.add("MenuButton");
        board_info.onclick = () => start_game(board);
        board_info.innerHTML += "<img class='board_image' src='" + board.image_path + "' alt='Board Image' height='120'>";
        board_info.innerHTML += "<p class='board_text'>" + board.name + "</p>";

        boards_html.append(board_info);
        let br = document.createElement("br");
        boards_html.append(br);
    }
}