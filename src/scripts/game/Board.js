import * as PIXI from "pixi.js";
import { App } from "../system/App";
import { Field } from "./Field";
import { Tile } from "./Tile";
import { TileFactory } from "./TileFactory";

export class Board {
    constructor() {
        this.container = new PIXI.Container();
        this.fields = [];
        this.rows = App.config.board.rows;
        this.cols = App.config.board.cols;
        this.scale = this.calculateScale(); // Вычисляем масштаб
        this.create();
        this.ajustPosition();
    }

    calculateScale() {
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const desiredWidth = 720; // Желаемая ширина игрового поля
        const desiredHeight = 1280; // Желаемая высота игрового поля
        const scaleX = screenWidth / desiredWidth;
        const scaleY = screenHeight / desiredHeight;
        return Math.min(scaleX, scaleY, 1); // Масштаб не больше 1
    }

    create() {
        this.createFields();
        this.createTiles();
    }

    createTiles() {
        this.fields.forEach(field => this.createTile(field));
    }

    createTile(field) {
        const tile = TileFactory.generate();
        tile.sprite.scale.set(this.scale); // Применяем масштаб
        field.setTile(tile);
        this.container.addChild(tile.sprite);
        tile.sprite.interactive = true;
        tile.sprite.on("pointerdown", () => {
            this.container.emit('tile-touch-start', tile);
        });
        return tile;
    }

    getField(row, col) {
        return this.fields.find(field => field.row === row && field.col === col);
    }

    createFields() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                this.createField(row, col);
            }
        }
    }

    createField(row, col) {
        const field = new Field(row, col);
        this.fields.push(field);
        this.container.addChild(field.sprite);
    }

    ajustPosition() {
        this.fieldSize = this.fields[0].sprite.width * this.scale;
        this.width = this.cols * this.fieldSize;
        this.height = this.rows * this.fieldSize;
        this.container.x = (window.innerWidth - this.width) / 2;
        this.container.y = (window.innerHeight - this.height) / 2;
    }

    swap(tile1, tile2) {
        const tile1Field = tile1.field;
        const tile2Field = tile2.field;
        tile1Field.tile = tile2;
        tile2.field = tile1Field;
        tile2Field.tile = tile1;
        tile1.field = tile2Field;
    }
}
