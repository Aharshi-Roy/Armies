class Unit
{
    constructor(name, holds_strength)
    {
        this.name = name;
        this.holds_strength = holds_strength;
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
    }
}

class Game
{
    constructor(BOARD_ID, BOARD_WIDTH, BOARD_HEIGHT, BOARD_PIXEL_WIDTH, BOARD_PIXEL_HEIGHT, player_amount, option, player_array, INFO_ID, INFO_WIDTH, OBJECT_NAME)
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
        this.player_amount = player_amount;
        this.player_turn = 0;
        this.player_array = player_array;
        this.html_board = document.getElementById(BOARD_ID);
        this.info = document.getElementById(INFO_ID);
        this.info.style.width = INFO_WIDTH + "px";
        this.info.style.left = (BOARD_PIXEL_WIDTH + 50) + "px";
        this.info.style.height = BOARD_PIXEL_HEIGHT/2 + "px";
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
        this.html_board.style.width = this.BOARD_PIXEL_WIDTH + "px";
        this.html_board.style.height = this.BOARD_PIXEL_HEIGHT + "px";
        this.set_map(BOARD_WIDTH, BOARD_HEIGHT, player_amount, option);
        this.board[5][2].player = 0
        this.board[5][2].unit_type = "navy";
        this.board[5][1].player = 0
        this.board[5][1].unit_type = "army";
        this.board[5][0].player = 0
        this.board[5][0].unit_type = "trader";
        this.board[6][2].player = 0;
        this.board[6][2].unit_type = "city";
        this.board[6][1].player = 0;
        this.board[6][1].unit_type = "blockade";
        this.unit_array = [new Unit("navy", true), new Unit("army", true), new Unit("city", true), new Unit("blockade", false), new Unit("trader", false)];
        this.render();
    }
    get_selected_tile()
    {
        return this.board[this.selected_tile[0]][this.selected_tile[1]];
    }
    update_turn()
    {
        if (this.player_turn < this.player_amount) this.player_turn++;
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
        if (this.selected_tile[0] != -1 && this.selected_tile[1] !=-1)
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
        console.log("Called!");
        if (this.selected_tile[0] != i || this.selected_tile[1] != j) this.selected_tile = [i, j];
        else this.selected_tile = [-1, -1];
        console.log(this.selected_tile);
        this.render();
    }
}

let player = new Player("blue", "dodgerblue");
let game = new Game("Board", 7, 7, 1000, 1000, 3, 1, [player], "Info", 400, "game");