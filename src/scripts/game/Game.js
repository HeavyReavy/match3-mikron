import * as PIXI from "pixi.js";
import { App } from "../system/App";
import { Board } from "./Board";
import { CombinationManager } from "./CombinationManager";
    
export class Game {
    constructor() {
        this.container = new PIXI.Container();
        this.createBackground();
        this.board = new Board();
        this.container.addChild(this.board.container);
        this.board.container.on('tile-touch-start', this.onTileClick.bind(this));
        this.combinationManager = new CombinationManager(this.board);
        this.removeStartMatches();
        this.resizeGame(); // Добавляем вызов метода для масштабирования
        window.addEventListener('resize', this.resizeGame.bind(this)); // Реагируем на изменение размера окна
    }
    
    resizeGame() {
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const isMobile = screenWidth < 768; // Условие для мобильных устройств
    
        // Масштабируем контейнер игры
        if (isMobile) {
            const scale = Math.min(screenWidth / 600, screenHeight / 600, 0.7); // 600 - исходный размер, 0.7 - максимальный масштаб для мобильных
            this.container.scale.set(scale);
        } else {
            this.container.scale.set(1);
        }
    
        // Центрируем контейнер
        this.container.x = (screenWidth - this.container.width * this.container.scale.x) / 2;
        this.container.y = (screenHeight - this.container.height * this.container.scale.y) / 2;
    }

    removeStartMatches() {
        let matches = this.combinationManager.getMatches();

        while(matches.length) {
            this.removeMatches(matches);

            const fields = this.board.fields.filter(field => field.tile === null);

            fields.forEach(field => {
                this.board.createTile(field);
            });

            matches = this.combinationManager.getMatches();
        }
    }

    createBackground() {
        this.bg = App.sprite("bg");
        this.container.addChild(this.bg);
    
        // Получаем размеры окна
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
    
        // Получаем размеры текстуры фона
        const bgWidth = this.bg.texture.width;
        const bgHeight = this.bg.texture.height;
    
        // Вычисляем масштаб, чтобы фон покрывал весь экран
        const scaleX = screenWidth / bgWidth;
        const scaleY = screenHeight / bgHeight;
        const scale = Math.max(scaleX, scaleY);
    
        // Применяем масштаб
        this.bg.scale.set(scale);
    
        // Центрируем фон
        this.bg.x = (screenWidth - bgWidth * scale) / 2;
        this.bg.y = (screenHeight - bgHeight * scale) / 2;
    }

    onTileClick(tile) {
        if (this.disabled) {
            return;
        }
        if (this.selectedTile) {
            // select new tile or make swap
            if (!this.selectedTile.isNeighbour(tile)) {
                this.clearSelection(tile);
                this.selectTile(tile);
            } else {
                this.swap(this.selectedTile, tile);
            }


        } else {
            this.selectTile(tile);
        }
    }

    swap(selectedTile, tile, reverse) {
        this.disabled = true;
        selectedTile.sprite.zIndex = 2;

        selectedTile.moveTo(tile.field.position, 0.2);

        this.clearSelection();

        tile.moveTo(selectedTile.field.position, 0.2).then(() => {
            this.board.swap(selectedTile, tile);

            if (!reverse) {
                const matches = this.combinationManager.getMatches();
                if (matches.length) {
                    this.processMatches(matches);
                } else {
                    this.swap(tile, selectedTile, true);
                }
            } else {
                this.disabled = false;
            }
        });
    }

    removeMatches(matches) {
        matches.forEach(match => {
            match.forEach(tile => {
                tile.remove();
            });
        });
    }

    processMatches(matches) {
        this.removeMatches(matches);
        this.processFallDown()
            .then(() => this.addTiles())
            .then(() => this.onFallDownOver());
    }

    onFallDownOver() {
        const matches = this.combinationManager.getMatches();

        if (matches.length) {
            this.processMatches(matches)
        } else {
            this.disabled = false;
        }
    }

    addTiles() {
        return new Promise(resolve => {
            const fields = this.board.fields.filter(field => field.tile === null);
            let total = fields.length;
            let completed = 0;

            fields.forEach(field => {
                const tile = this.board.createTile(field);
                tile.sprite.y = -500;
                const delay = Math.random() * 2 / 10 + 0.3 / (field.row + 1);
                tile.fallDownTo(field.position, delay).then(() => {
                    ++completed;
                    if (completed >= total) {
                        resolve();
                    }
                });
            });
        });``
    }

    processFallDown() {
        return new Promise(resolve => {
            let completed = 0;
            let started = 0;

            for (let row = this.board.rows - 1; row >= 0; row--) {
                for (let col = this.board.cols - 1; col >= 0; col--) {
                    const field = this.board.getField(row, col);
    
                    if (!field.tile) {
                        ++started;
                        this.fallDownTo(field).then(() => {
                            ++completed;
                            if (completed >= started) {
                                resolve();
                            }
                        });
                    }
                }
            }
        });
    }

    fallDownTo(emptyField) {
        for (let row = emptyField.row - 1; row >= 0; row--) {
            let fallingField = this.board.getField(row, emptyField.col);

            if (fallingField.tile) {
                const fallingTile = fallingField.tile;
                fallingTile.field = emptyField;
                emptyField.tile = fallingTile;
                fallingField.tile = null;
                return fallingTile.fallDownTo(emptyField.position);
            }
        }

        return Promise.resolve();
    }

    clearSelection() {
        if (this.selectedTile) {
            this.selectedTile.field.unselect();
            this.selectedTile = null;
        }
    }

    selectTile(tile) {
        this.selectedTile = tile;
        this.selectedTile.field.select();
    }
}