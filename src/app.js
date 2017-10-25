import {
    Geometry,
    PointsMaterial,
    Color,
    Vector3,
    Points,
    Raycaster
} from 'three';
var THREE = require('three')
var OrbitControls = require('three-orbit-controls')(THREE)
import {dat} from 'threejs-utils';
import {scene,renderer,group} from './components/scene';
import camera from './components/camera';
import Stats from './components/stats';
import datgui from './components/controls';
import {drawAirports,drawAirportsByCountry} from './components/draw/drawAirports';
import {drawRouteByCondition,drawRoutes} from './components/draw/drawRoutes';

export default class App {
    constructor(){
        this.initCamera();
        this.initControl();
        this.initStat();
        this.initWindow();
        // 添加渲染器到页面
        document.getElementById('app').appendChild(renderer.domElement);
        this.requestData();
        this.render();
    }
// 动画循环
    render(){
        requestAnimationFrame(this.render.bind(this));
        this.stats.update();
        group.rotation.y -= this.controls.rotaSpeed;
        group.scale.set(this.controls.globeScaleRate, this.controls.globeScaleRate, this.controls.globeScaleRate);
        renderer.render(scene, camera);
    }
    //相机控制器
    initCamera(){
        let controls = new OrbitControls(camera,renderer.domElement);
        controls.enabled = true;
        controls.maxDistance = 1500;
        controls.minDistance = 0;
        controls.addEventListener('change', function () {
            renderer.render(scene, camera);
        });
    }
    // 帧数计算
    initStat(){
        this.stats = new Stats();
        document.getElementById('app').appendChild(this.stats.domElement);
    }
    // 窗口大小变化刷新
    initWindow(){
        window.addEventListener('resize', () => {
            var windowHalfX = window.innerWidth / 2;
            var windowHalfY = window.innerHeight / 2;

            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }, false);
    }
    // 参数控制器
    initControl(){
        this.controls = new function(){
            this.globeScaleRate = 1.0;
            this.rotaSpeed = 0.005;
        };
        new datgui(this.controls);
    }
    requestData(){
        fetch('/data/airlines.json').then(res => {
           return res.json()
        }).then(airlines => {
            const airlineNum = 30;
            const controls = {};
            let gui = new dat.GUI({autoPlace:false});
            let airlinesGUIContainer = document.getElementById('airlines-gui-container');
            airlinesGUIContainer.appendChild(gui.domElement);
            let folder = gui.addFolder('airlines');

            for(let i = 0; i < airlineNum; i++){
                controls[airlines[i][1]] = () => {
                    drawRouteByCondition('airline',airlines[i][0]);
                };
                folder.add(controls,airlines[i][1]);
            }
            folder.open();
            drawRouteByCondition('srcAirport','188');
        });
        fetch('/data/airports.json').then((res) => {
            return res.json();
        }).then(airports => {
            // 将数据传给worker处理并返回结果
            let airportsWorker = new Worker('/workers/airports.js');
            airportsWorker.postMessage({airports,globalRadius:150});
            airportsWorker.onmessage = e => {
                let data = e.data;
                let gui = new dat.GUI();
                let folder = gui.addFolder('airports');
                let divByCountry = data.airports.divideByCountry;
                let countries = Object.keys(divByCountry);
                const controls = {};
                const countriesNum = 40;

                for(let i = 0; i < countriesNum; i++){
                    controls[countries[i]] = () => {
                        drawAirportsByCountry(divByCountry,countries[i]);
                    };
                    folder.add(controls,countries[i]);
                }
                folder.open();
                //drawAirports(data.airports.allAirportsPos);
                drawAirportsByCountry(data.airports.divideByCountry,'Australia');
            };
        });
    }
};
