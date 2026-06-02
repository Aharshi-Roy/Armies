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
        let return1 = this.cells[0].change_strength(-this.extra_info, true);
        let return2 = this.cells[1].change_strength(this.extra_info, true);
        if (return1 == "clear" && return2 == "clear")
        {
            return "clear";
        }
        else
        {
            if (return1 == "clear")
            {
                this.cells[0].change_strength(this.extra_info, true);
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
        if (this.cells[0].change_strength(-this.extra_info[1], true) == "clear")
        {
            this.cells[1].place_unit(this.extra_info[0], 1, this.extra_info[2], true);
            return "clear";
        }
        else return "invalid";
    }
    battle()
    {
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
                clearInterval(battle_timer);
            }
            if (this.cells[1].strength <= 0)
            {
                this.cells[1].remove_unit(false);
                clearInterval(battle_timer);
            }
            this.game.render();
        }, 1000);
        console.log("Func Finished");
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
        let action = new Action([this.board[6][2], this.board[5][2]], "battle", "none", this);
        this.actions.push(action);
        this.html_board.style.width = this.BOARD_PIXEL_WIDTH + "px";
        this.html_board.style.height = this.BOARD_PIXEL_HEIGHT + "px";
        this.set_map(BOARD_WIDTH, BOARD_HEIGHT, player_amount, option);
        this.get_tile([5, 2]).place_unit("navy", 3, 1, false);
        this.get_tile([5, 1]).place_unit("army", 5, 1, false);
        this.get_tile([5, 0]).place_unit("trader", 0, 0, false);
        this.get_tile([6, 1]).place_unit("blockade", 3, 0, false);
        this.get_tile([6, 2]).place_unit("city", 5, 0, false);
        this.get_tile([0, 0]).place_unit("city", 8, 2, false);
        this.unit_array = 
        [
            new Unit("navy", true, 5, ["water"], ["army", "blockade", "city"], ["transact", "build", "battle", "trade"]),
            new Unit("army", true, 4, ["land", "soil"], ["blockade", "city"], ["transact", "build", "battle", "trade"]),
            new Unit("city", true, 5, ["soil", "ore deposit"], ["army", "navy", "trader", "blockade", "city"], ["produce", "transact", "build", "battle", "trade"]),
            new Unit("blockade", false, 4, ["land"], [], ["trade"]),
            new Unit("trader", false, 3, ["land"], [], ["remove"])
        ];
        this.render();
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
        this.selected_tile = [-1, -1]
        this.update_turn();
        this.render();
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
        else if (type == "ore deposit") return "black";
        else return "grey";
    }
    render()
    {
        let UNIT_RATIO  = [.8, .2];
        this.html_board.innerHTML = ""
        for (let i = 0; i < this.BOARD_HEIGHT; i++)
        {
            for (let j = 0; j < this.BOARD_WIDTH; j++)
            {
                this.html_board.innerHTML += "<div class='Cell' style='top: " + this.BOARD_CELL_PIXEL_HEIGHT*i + "px; left: " + this.BOARD_CELL_PIXEL_WIDTH*j +"px; height: " + (this.BOARD_CELL_PIXEL_HEIGHT-2) +"px; width: "+ (this.BOARD_CELL_PIXEL_WIDTH-2) + "px; background-color: " + this.land_type_to_color(this.board[i][j].land_type) + ";' id='" + i + "-" + j + "'></div>";
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
                        unit.style.borderBottom = (this.BOARD_CELL_PIXEL_WIDTH*.5) + "px solid black";
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
                        unit.style.border = ((this.BOARD_CELL_PIXEL_HEIGHT*.5+this.BOARD_CELL_PIXEL_WIDTH*.5)/2)*UNIT_RATIO[1] + "px solid black";
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
                        unit.style.border = ((this.BOARD_CELL_PIXEL_HEIGHT*.5+this.BOARD_CELL_PIXEL_WIDTH*.5)/2)*UNIT_RATIO[1] + "px solid black";
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
        if (this.selected_tile[0] != -1 && this.selected_tile[1] !=-1 && this.get_selected_tile().player != -1)
        {
            this.info.style.display = "block";
            let unit_type = this.get_selected_tile().unit_type
            unit_type = unit_type[0].toUpperCase() + unit_type.slice(1);
            this.info.innerHTML = "<h1>" + unit_type + "</h1>";
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
        this.render();
    }
    do_all_actions()
    {
        for (let action of this.actions)
        {
            console.log(action.do_action());
        }
        this.actions = [];
        this.render();
    }
}

let player = new Player("blue", "dodgerblue");
let player2 = new Player("red", "pink");
let player3 = new Player("forestgreen", "lawngreen")
let game = new Game("Board", 7, 7, 1000, 1000, 3, 1, [player, player2, player3], "Info", 400, "game", "DoAction", "EndTurn", 100);