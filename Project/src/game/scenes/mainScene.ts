enum Direction {
    Top,
    Left,
    Right,
    Bottom
}

export class MainScene extends Phaser.Scene {
    private worldMap: Phaser.Tilemaps.Tilemap;
    private marker: Phaser.GameObjects.Graphics;

    constructor() {
        super({
            key: "MainScene"
        });

    }

    preload(): void {
        this.load.image("mapTiles", "./src/game/assets/map/map.png");
        this.load.image("buildingsTiles", "./src/game/assets/map/buildings.png");
        this.load.tilemapTiledJSON("tilemap", "./src/game/assets/map/map.json");
    }

    create(): void {
        this.worldMap = this.make.tilemap({ key: "tilemap" });

        var mapTileset = this.worldMap.addTilesetImage("map", "mapTiles");
        var buildingsTileset = this.worldMap.addTilesetImage("buildings", "buildingsTiles");

        var groundLayer = this.worldMap.createDynamicLayer("Ground", mapTileset, 0, 0);
        var roadsLayer = this.worldMap.createDynamicLayer("Roads", mapTileset, 0, 0);
        var buildingsLayer = this.worldMap.createDynamicLayer("Buildings", buildingsTileset, 0, 0);

        this.cameras.main.setZoom(0.2);
        this.cameras.main.centerOn(1200, 1400);

        this.marker = this.add.graphics();
        this.marker.lineStyle(2, 0x000000, 1);
        this.marker.strokeRect(0, 0, this.worldMap.tileWidth, this.worldMap.tileHeight);



        this.worldMap.setLayer(1);

        var railroadTiles: Phaser.Tilemaps.Tile[] = [];
        var checkedTile = this.worldMap.getTileAt(16, 11);

        railroadTiles.push(checkedTile);

        var cycleProtector = 1000;
        while (true) {
            cycleProtector--;
            if (cycleProtector < 0) {
                break;
            }

            let hasTilesForCheck = false;
            let lastTile = railroadTiles[railroadTiles.length - 1];
            if (railroadTiles.length >= 2) {
                lastTile = railroadTiles[railroadTiles.length - 2];
            }

            if (this.ckeckTileDock(checkedTile, this.worldMap, Direction.Top) && hasTilesForCheck == false) {
                var topTilePos = new Phaser.Math.Vector2(checkedTile.x, checkedTile.y - 1);
                var lastTilePos = new Phaser.Math.Vector2(lastTile.x, lastTile.y);
                if (topTilePos.equals(lastTilePos) == false) {
                    checkedTile = this.worldMap.getTileAt(topTilePos.x, topTilePos.y);
                    hasTilesForCheck = true;
                }
            }
            if (this.ckeckTileDock(checkedTile, this.worldMap, Direction.Left) && hasTilesForCheck == false) {
                var leftTilePos = new Phaser.Math.Vector2(checkedTile.x - 1, checkedTile.y);
                var lastTilePos = new Phaser.Math.Vector2(lastTile.x, lastTile.y);
                if (leftTilePos.equals(lastTilePos) == false) {
                    checkedTile = this.worldMap.getTileAt(leftTilePos.x, leftTilePos.y);
                    hasTilesForCheck = true;
                }
            }
            if (this.ckeckTileDock(checkedTile, this.worldMap, Direction.Bottom) && hasTilesForCheck == false) {
                var bottomTilePos = new Phaser.Math.Vector2(checkedTile.x, checkedTile.y + 1);
                var lastTilePos = new Phaser.Math.Vector2(lastTile.x, lastTile.y);
                if (bottomTilePos.equals(lastTilePos) == false) {
                    checkedTile = this.worldMap.getTileAt(bottomTilePos.x, bottomTilePos.y);
                    hasTilesForCheck = true;
                }
            }
            if (this.ckeckTileDock(checkedTile, this.worldMap, Direction.Right) && hasTilesForCheck == false) {
                var rightTilePos = new Phaser.Math.Vector2(checkedTile.x + 1, checkedTile.y);
                var lastTilePos = new Phaser.Math.Vector2(lastTile.x, lastTile.y);
                if (rightTilePos.equals(lastTilePos) == false) {
                    checkedTile = this.worldMap.getTileAt(rightTilePos.x, rightTilePos.y);
                    hasTilesForCheck = true;
                }
            }

            if (hasTilesForCheck == false) {
                console.log("finished buil railroad");
                break;
            }
            railroadTiles.push(checkedTile);
        }

        console.log(railroadTiles);

        //var tiles = this.worldMap.getTilesWithin();
    }

    update(): void {
        var worldPoint: Phaser.Math.Vector2 = <Phaser.Math.Vector2>this.input.activePointer.positionToCamera(this.cameras.main);

        var pointerTileX: number = this.worldMap.worldToTileX(worldPoint.x);
        var pointerTileY: number = this.worldMap.worldToTileY(worldPoint.y);

        this.marker.x = this.worldMap.tileToWorldX(pointerTileX);
        this.marker.y = this.worldMap.tileToWorldY(pointerTileY);

        if (this.input.activePointer.isDown) {
            var tile = this.worldMap.getTileAt(pointerTileX, pointerTileY, true);
            console.log(" X: " + pointerTileX + " Y: " + pointerTileY);
        }
    }

    ckeckTileDock(checkedTile: Phaser.Tilemaps.Tile, map: Phaser.Tilemaps.Tilemap, direction: Direction): boolean {
        var dockedTilePos = new Phaser.Math.Vector2(-1, -1);

        switch (direction) {
            case Direction.Top:
                dockedTilePos = new Phaser.Math.Vector2(checkedTile.x, checkedTile.y - 1);
                break;
            case Direction.Left:
                dockedTilePos = new Phaser.Math.Vector2(checkedTile.x - 1, checkedTile.y);
                break;
            case Direction.Bottom:
                dockedTilePos = new Phaser.Math.Vector2(checkedTile.x, checkedTile.y + 1);
                break;
            case Direction.Right:
                dockedTilePos = new Phaser.Math.Vector2(checkedTile.x + 1, checkedTile.y);
                break;
            default:
                break;
        }

        if (checkedTile != null) {
            var dockedTile = map.getTileAt(dockedTilePos.x, dockedTilePos.y);
            return this.isDock(checkedTile, dockedTile);
        }
        else {
            return false;
        }
    }

    isDock(tile1: Phaser.Tilemaps.Tile, tile2: Phaser.Tilemaps.Tile): boolean {
        if (tile1 != null && tile2 != null) {
            if (tile1.properties["point1"] == tile2.properties["point1"] ||
                tile1.properties["point1"] == tile2.properties["point2"]) {
                return true;
            } else if (tile1.properties["point2"] == tile2.properties["point1"] ||
                tile1.properties["point2"] == tile2.properties["point2"]) {
                return true;
            }
        }

        return false;
    }

    drawDebugRect(tile: Phaser.Tilemaps.Tile) {
        this.add.rectangle(tile.pixelX, tile.pixelY, this.worldMap.tileWidth, this.worldMap.tileHeight, 0xffa500).setOrigin(0).setAlpha(0.5);
    }

    inMapBounds(tilePos: Phaser.Math.Vector2, map: Phaser.Tilemaps.Tilemap): boolean {
        var inHorizontalBounds = false;
        if (tilePos.x >= 0 && tilePos.x < map.width) {
            inHorizontalBounds = true;
        }
        var inVerticalBounds = false;
        if (tilePos.y >= 0 && tilePos.y < map.height) {
            inVerticalBounds = true;
        }

        if (inHorizontalBounds && inVerticalBounds) {
            return true;
        } else {
            return false;
        }
    }
}
