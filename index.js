"use strict";
let ctx;
let ship;			//母船オブジェクト
let beam;			//母船のビームオブジェクト
let aliens = [];	//エイリアンオブジェクトの配列
let bombs = [];		//爆弾オブジェクトの配列
let score = 0;		//スコア
let stage = 1;
let clock = 0;		//爆弾のタイミングやステージクリアのタイミングを処理するカウンタ
let mainT = NaN;
let alienT = NaN;

function Beam() {
	this.x = 0;
	this.y = -100;
	this.offset = 0;
	this.even = false;
	//オブジェクトごとに描画を切り替える
	this.isEven = function () {
		return this.even;
	}
}

function Bomb() {
	this.x = 0;
	this.y = 600;
	this.offset = 48;
	this.even = false;
	//いつ爆弾を落とすか
	this.time = rand(200) + 50;
	//オブジェクトごとに描画を切り替える
	this.isEven = function () {
		return this.even;
	}
}

function Alien(x, y, point, offset) {
	this.x = x;
	this.y = y;
	this.point = point;
	this.offset = offset;
	//同時に切り替える
	this.isEven = function () {
		return Alien.isEven;
	}
}

function Ship() {
	this.x = 0;
	this.y = 550;
	this.offset = 192;
	//キーの押下状態
	this.moveL = false;
	this.moveR = false;
	//切り替える必要はない
	this.isEven = function () {
		return true;
	}
}

//それぞれの画像の描画
let bitmap = {
	draw: function (ctx) {
		if (!this.strip) {
			this.strip = document.getElementById('strip');
		}
		ctx.drawImage(this.strip, this.offset + (this.isEven() ? 0: 24), 0, 24, 24, this.x, this.y, 24, 24);
	}
}

//すべて画面上に描画するためbitmapをprototypeとして参照
Ship.prototype = Beam.prototype = Alien.prototype = Bomb.prototype = bitmap;

Alien.isEven = false;
Alien.isDown = false;
Alien.isLeft = false;
Alien.interval = 1000;

//0からmaxまでの整数を返す関数
function rand(max) {
	return Math.floor(Math.random() * max);
}

//初期化時に呼ぶ
function init() {
	//コンテキストを取得
	ctx = document.getElementById('canvas').getContext('2d');
	//フォントを設定
	ctx.font = "20pt Arial";
	//初期化
	score = 0,
	stage = 1;
	//イベントハンドラーの登録
	addEventListener('keydown', keyDown, true);
	addEventListener('keyup', keyUp, true);
	start();
}

//各ステージを開始
function start() {
	//初期化
	ship = new Ship();
	beam = new Beam();
	clock = 0;
	//ステージが進むごとに速くなる
	Alien.interval = 1000 - stage * 50;
	//Alienオブジェクト作成
	for (let i = 0; i < 4; i++) {
		let offset = (i < 2) ? 96 : 144;
		for (let j = 0; j < 10; j++) {
			aliens.push(new Alien(
								100 + j * 50,			//x座標
								i * 50 + 50 * stage,	//y座標
								(4 - i) * 10,			//得点
								offset					//画像のオフセット
								)
						);
		}
		//Bombオブジェクトをbombs配列に格納
		bombs.push(new Bomb());
	}
	//徐々にスピードをあげる
	if (isNaN(alienT)) {
		alienT = setTimeout(alienLoop, Alien.interval);
	}
	//恒に一定間隔
	if (isNaN(mainT)) {
		mainT = setInterval(mainLoop, 50);
	}
}

//キー入力処理
function keyDown(evt) {
	//spaceキー押下かつbeamが画面外
	if (evt.keyCode == 32 && beam.y < 0) {
		beam.y = 520;
		beam.x = ship.x;
	}
	//左キー
	if (evt.keyCode == 37) {
		ship.moveL = true;
	}
	//右キー
	if (evt.keyCode == 39) {
		ship.moveR = true;
	}
}

//キー入力処理
function keyUp(evt) {
	if (evt.keyCode == 37) {
		ship.moveL = false;
	}
	if (evt.keyCode == 39) {
		ship.moveR = false;
	}
}

function alienLoop() {
	let minX = Infinity;
	let maxX = 0;
	let maxY = 0;
	//全Alienの画像切替
	Alien.isEven = !Alien.isEven;

	//update aliens' position
	aliens.forEach(function (e) {
		//isDownが偽のときｘ方向に-10か10移動
		e.x += Alien.isDown ? 0 : (Alien.isLeft ? -10 : 10);
		//isDownが真のときy方向に20移動
		e.y += Alien.isDown ? 20 : 0;
	});
	aliens.forEach(function (e) {
		minX = Math.min(minX, e.x);
		maxX = Math.max(maxX, e.x);
		maxY = Math.max(maxY, e.y);
	});

	//下に動いたとき次回は左右のどちらかへ
	if (Alien.isDown) {
		Alien.isDown = false;
	//左端に到達したときは右に向きを変えて一段下がる
	} else if (minX < 20) {
		Alien.isDown = true;
		Alien.isLeft = false;
	//右端に到達したときは左に向きを変えて一段下がる
	} else if (maxX > 560) {
		Alien.isDown = true;
		Alien.isLeft = true;
	}
	//下まで到達するとゲームオーバー
	if (maxY > 550) {
		gameOver();
	//時間を5ミリ秒短くしてseTimeout呼び出し
	} else {
		Alien.interval =Math.max(50, Alien.interval - 5);
		setTimeout(alienLoop, Alien.interval);
	}
}

//タイマーを止めて再描画
function gameOver() {
	clearInterval(mainT);
	mainT = NaN;
	clearTimeout(alienT);
	alienT = NaN;
	draw();
}

function mainLoop() {
	clock++;
	//aliensの残り0になったらクリア
	if (aliens.length == 0) {
		if (clock > 100) {
			stage++;
			start();
		}
		return;
	}
	//uodate beam and check if it hits an alien
	//beamがAliensに当たったかの判定
	let hit = -1;
	//ビームが画面の中にいる場合
	if (beam.y > -30) {
		beam.y -= 15;
		//画像の切り替え
		beam.even = !beam.even;
		//個々のAlienとビームの座標値を比較
		aliens.forEach(function (e, i) {
			//座標が+-15に収まっていた場合衝突
			if (e.x - 15 < beam.x &&
				beam.x < e.x + 15 &&
				e.y - 10 < beam.y &&
				beam.y < e.y + 20) {
				//インデックスをhitに一旦保存
				hit = i;
				//ビームを画面外に設定して画面から消す
				beam.y = -100;
				//スコア加算
				score += e.point;
				return;
			}
		});
	}
	//当たっていると判定
	if (hit >= 0) {
		//配列から削除
		aliens.splice(hit, 1);
		//stage clear
		if (aliens.length == 0) {
			clock = 0;
			draw();
			return;
		}
	}
	//update bombs and check if it hit the ship
	//爆弾の処理
	bombs.forEach(function (b) {
		//発車時刻と現在時刻を比較
		if (b.time < clock) {
			//Alienオブジェクトの座標でBombのxとy座標を初期化
			let a = aliens[rand(aliens.length)];
			b.x = a.x;
			b.y = a.y + 30;
			//次に発射する時刻を乱数で求めtimeにセット
			b.time += rand(200) + 50;
		}
		//Bombが画面中にある場合
		else if (b.y < 600) {
			b.y += 10;
		}
		//画像切替
		b.even = !b.even;
		//母船と衝突判定
		if (b.x - 15 < ship.x &&
			ship.x < b.x + 15 &&
			530 < b.y &&
			b.y < 550) {
				gameOver();
			}
	});
	//move the ship
	if (ship.moveR) {
		ship.x = Math.min(ship.x + 5, 570);
	}
	if (ship.moveL) {
		ship.x = Math.max(ship.x - 5, 0);
	}
	draw();
}

//画面描画
function draw() {
	// fill background
	ctx.fillStyle = 'rgb(0, 0, 0)';
	ctx.fillRect(0, 0, 600, 600);

	//draw aliens
	aliens.forEach(function (a) {
		a.draw(ctx);
	});

	//draw ship
	ship.draw(ctx);

	//draw beam
	beam.draw(ctx);

	//draw bombs
	bombs.forEach(function (b) {
		b.draw(ctx);
	});

	//draw score
	ctx.fillStyle = 'rgb(0, 255, 0)';
	ctx.fillText(('0000000' + score).slice(-7), 470, 30);

	if (aliens.length == 0) {
		ctx.fillText('STAGE CLEAR', 200, 150);
	}

	if (isNaN(mainT)) {
		ctx.fillText('GAME OVER', 220, 150);
	}
}