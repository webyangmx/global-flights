$(function () {
//        全局变量列表
    var scene, camera, renderer, group, mesh, pointLight,highLight, cameraCtrl;
    var earthMaterial,pointMaterial;
    var loader = new THREE.TextureLoader();
    var controls,stats,gui,routeListGui,pointLightCtrl,highLightCtrl;
    var globeRadius = 150;
    var raycaster,particleSystem;
    var allAirportsVertices;
    var allAirportsPos,idRelationMap,airlineIDRealationMap;

    var pointsLinesGUI;

// 数据存储
    var airportsData,airlinesData,routesData;
    var routeListMap = {};

// 画线动画
    var buffer_geometry,
        positions,
        tween,
        line;
// tips
    var tips = null;

//        初始化THREE
    function initThree() {
        scene = new THREE.Scene();
        renderer = new THREE.WebGLRenderer({antialias: true});
        renderer.setClearColor(0x000000);
        renderer.setSize(window.innerWidth, window.innerHeight - 3);
        group = new THREE.Group();
        window.mygroup = group;

        scene.add(group);
        document.getElementById('app').appendChild(renderer.domElement);

        raycaster = new THREE.Raycaster();
        // how large it is defines how far away you can be for the click to register on a particle
        // 阈值 相当于点击有效半径
        raycaster.params.Points.threshold = 1;
    }

    function initSearch() {
      var searchTypeDom = $('.search-type'),
          searchItemDom = $('.search-item'),
          searchInputTargetDom = $('#airport-start');
      $('#airport-airline,#airport-start,#airport-end').on('click',function() {
        searchInputTargetDom = $(this);
      });
      searchTypeDom.on('click',function() {
        searchItemDom.toggle();
      });
      searchItemDom.on('click',function(e) {
        searchTypeDom.text($(e.target).text());
        if($(e.target).text() == 'Path'){
          $('.path').show();
          $('#airport-airline').hide();
        }else{
          $('.path').hide();
          $('#airport-airline').show();
        }
        searchItemDom.hide();
      });
      $('#airport-airline,#airport-start,#airport-end').on('input',function(){
        var searchContent = $(this).val();
        if(!searchContent){
          $('.search-result').html('');
          return;
        }
        var searchResult = [];
        var searchContentArray = searchContent.split('');
        var reg = new RegExp($(this).val(),'i');
        if(searchTypeDom.text() === 'Airports'){
          airportsData.forEach(function(airport) {
            var airportString = airport.toString();
            if(reg.test(airportString)){
              searchResult.push(airportString);
            }
          });
        }else if(searchTypeDom.text() === 'Path'){
          airportsData.forEach(function(airport) {
            var airportString = airport.toString();
            if(reg.test(airportString)){
              searchResult.push(airportString);
            }
          });
        }else{
          airlinesData.forEach(function(airline) {
            var airlineString = airline.toString();
            if(reg.test(airlineString)){
              searchResult.push(airlineString);
            }
          });
        }
        var template = '';
        searchResult.forEach(function(item) {
          template = template + '<li>' + item + '</li>';
        });
        $('.search-result').html(template);
      });

        $('.search-result').on('click',function(e) {
          searchInputTargetDom.val($(e.target).text());// 选择某项后将选择的内容填充到输入框
          // 直接在机场字符串中取id会造成id混乱 因为有许多值为NULL的机场
          var selectId = $(e.target).text().split(',')[0];
          $(this).html('');
          if($('.search-type').text() === 'Airports' || $('.search-type').text() === 'Path'){
            if(!selectId){return;}
            if($('.search-type').text() === 'Airports'){
              showAirportInfo(idRelationMap[selectId]);
              drawRouteByCondition('srcAirport', selectId);
              var selectAirport = airportsData[idRelationMap[selectId]];
              if(!selectAirport)return;
              // 如果有画航线 则让相机照向selectAirport
              cameraLookAt(camera,{long:selectAirport[7],lat:selectAirport[6]});
              // 使用四元数让相机旋转
              // cameraLookAtByQuaternion(camera,{long:selectAirport[7],lat:selectAirport[6]});
            }else if($('.search-type').text() === 'Path'){
              var startText = $('#airport-start').val();
              var endText = $('#airport-end').val();
              if(startText && endText)
                findPath(startText,endText)
            }
          }else{
            showAirlineInfo(airlineIDRealationMap[selectId]);// 航班ID也要转换成实际数组下标
            drawRouteByCondition('airline', airlineIDRealationMap[selectId]);
          }
        });
    }

    function findPath(start,end) {
      // 将原始airportId 转换为可用id
      // var startId = idRelationMap[start.split(',')[0]];
      // var endId = idRelationMap[end.split(',')[0]];
      var startId = start.split(',')[0];
      var endId = end.split(',')[0];
      if(!startId || !endId)return;

      // 开始计算两点间所有路径和最短路径
      var pathWorker = new Worker('./workers/path.js');
      pathWorker.postMessage({startId,endId,routesData,airportsData,idRelationMap,globeRadius});
      pathWorker.onmessage = function(e) {
        var type = e.data.type;
        var lines = e.data.lines;
        if(!lines)return;

        if(type === 'allPaths'){
          // for (var i = 0; i < lines.length; i++) {
          //   drawRoutes(type,i,lines[i],null);
          // }
          // var todo = lines.slice(0);
          // setTimeout(function() {
          //   drawRoutes(type,startId + '-' + endId + '-' + (lines.length - todo.length),todo.shift(),null);
          //   if(todo.length > 0){
          //     setTimeout(arguments.callee,3000);
          //   }
          // });
        }else if(type === 'minPath'){
          drawRoutes(type,startId + '-' + endId,lines[0],null);
        }
      }
    }



    function cameraLookAtByQuaternion(camera,targetLatLong) {
      var focusPoint = LatLong2Coor(globeRadius,targetLatLong.long,targetLatLong.lat);
      // var euler = new THREE.Euler(focusPoint.x,focusPoint.y,focusPoint.z,'XYZ');
      var focusVector = new THREE.Vector3(focusPoint.x + 10,focusPoint.y + 10,focusPoint.z + 10);
      var euler = new THREE.Euler().setFromVector3(focusVector);

      var cameraPos0 = camera.position.clone();
      var cameraUp0 = camera.up.clone();
      var cameraZoom = camera.position.z;


      // euler = new THREE.Euler(2.20, -0.15, 0.55);
      // zoom = 120;

      var endQ = new THREE.Quaternion();// target quaternion
      var iniQ = new THREE.Quaternion().copy(camera.quaternion);// initial quaternion
      var curQ = new THREE.Quaternion();// temp quaternion during slerp
      var vec3 = new THREE.Vector3();// generic vector object
      // tweenValue = 0

      endQ.setFromEuler(euler)
      // TweenLite.to(this, 5, { tweenValue:1, cameraZoom:zoom, onUpdate:onSlerpUpdate })
      var camearTween = new TWEEN.Tween(iniQ).to(endQ,1500);
      camearTween.easing(TWEEN.Easing.Cubic.Out);
      camearTween.onUpdate(function(e) {
          // interpolate quaternions with the current tween value
          // THREE.Quaternion.slerp( fromQuaternion, toQuaternion, quaternionToSet, fractionOfTheWay);
          THREE.Quaternion.slerp(iniQ, endQ, curQ , e.value);
          console.log(e,iniQ,curQ,endQ);
          // apply new quaternion to camera position
          vec3.x = cameraPos0.x
          vec3.y = cameraPos0.y
          vec3.z = cameraZoom
          vec3.applyQuaternion(curQ)
          camera.position.copy(vec3)

          // apply new quaternion to camera up
          vec3 = cameraUp0.clone()
          vec3.applyQuaternion(curQ)
          // camera.up.copy(vec3)

          cameraCtrl.update();
      });
      camearTween.start();
    }

    function cameraLookAt(camera,targetLatLong) {
      var focusPoint = LatLong2Coor(globeRadius,targetLatLong.long,targetLatLong.lat);
      var focusVector = new THREE.Vector3(focusPoint.x + 10,focusPoint.y + 10,focusPoint.z + 10);
      // 计算两向量间夹角
      var angle = camera.position.angleTo(focusVector);
      console.log('夹角',THREE.Math.radToDeg(angle));
      // 轴旋转
      var axis = new THREE.Vector3(0,0,0).copy(focusVector).cross(camera.position);
      // 求focusVector和camera.position的法向量保存在变量axis中
      // 那么axis就是旋转轴

      // 旋转轴需要normalize 转为单位向量
      var targetVector = new THREE.Vector3(0,0,0).copy(camera.position).applyAxisAngle(axis.normalize(),-angle);
      console.log(targetVector);
      var camearTween = new TWEEN.Tween(camera.position).to(targetVector,1500);
      camearTween.easing(TWEEN.Easing.Cubic.Out);
      camearTween.onUpdate(function() {
          cameraCtrl.update();
      });
      camearTween.start();
      // cameraCtrl.update();
    }

    //            相机位置设置
    function initCamera() {
        camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.x = -30;
        camera.position.y = 40;
        camera.position.z = 500;

        camera.lookAt(scene.position);
    }

    //          参数控制器
    function initControls() {
      const textureList = ['cloud.jpg','lala.jpg','world.jpg'];
      controls = new function () {
            this.globeScaleRate = 1.0;
            this.rotaSpeed = 0;
            this.earthTransparent = false;
            this.earthOpacity = 1;
            this.pointSize = 3;

            // 机场航线数最小值
            this.minRoutes = 0;
        };
        //地球模型相关参数
        gui = new dat.GUI();
        var f = gui.addFolder('Earth');
        f.add(controls, 'globeScaleRate', 0.5, 1.5);
        f.add(controls, 'rotaSpeed', 0, 0.03);
        f.add(controls, 'pointSize', 1, 6).onChange(function() {
          pointMaterial.size = controls.pointSize;
          pointMaterial.needsUpdate = true;
        });
        f.add(controls, 'earthTransparent').onChange(function() {
          earthMaterial.transparent = controls.earthTransparent;
        });
        f.add(controls, 'earthOpacity', 0, 1.0).onChange(function() {
          earthMaterial.opacity = controls.earthOpacity;
        });
        f.add(controls, 'minRoutes', 0, 400).onFinishChange(function() {
          particleSystem.userData.particles.forEach(function(point,index){
            // if(point.routesNum >= controls.minRoutes){
            //   particleSystem.geometry.colors[point.idx].setHex(0xff0000);
            // }else{
            //   particleSystem.geometry.colors[point.idx].setHex(0xffffff);
            // }
            // particleSystem.geometry.colorsNeedUpdate = true;
            if(point.routesNum < controls.minRoutes){
              particleSystem.geometry.vertices[point.idx] = new THREE.Vector3(0,0,0);
            }else{
              particleSystem.geometry.vertices[point.idx] = allAirportsVertices[point.idx];
            }
          });
          particleSystem.geometry.verticesNeedUpdate = true;
        });
        f.open();

        // 贴图列表
        var textureFolder = f.addFolder('Texture');
        var textureCtrl = {};
        for (var i = 0; i < textureList.length; i++) {
          textureCtrl[textureList[i]] = (function(i) {
            return function() {loader.load('./texture/' + textureList[i], function (texture) {
                earthMaterial.map = texture;
            });
          }
        })(i);
          textureFolder.add(textureCtrl,textureList[i]);
        }

        // 光照相关参数
        var lightFolder = f.addFolder('Light');
        var pointLightFolder = lightFolder.addFolder('pointLight');
        var highLightFolder = lightFolder.addFolder('highLight');
        pointLightCtrl = {
          distance: 80,
          intensity: 3
        };
        highLightCtrl = {
          distance: 800,
          intensity: 1
        };
        pointLightFolder.add(pointLightCtrl,'distance',1,120).onChange(function (e) {
            pointLight.distance = e;
        });
        pointLightFolder.add(pointLightCtrl,'intensity',0,5).onChange(function (e) {
            pointLight.intensity = e;
        });
        highLightFolder.add(highLightCtrl,'distance',500,2000).onChange(function (e) {
            highLight.distance = e;
        });
        highLightFolder.add(highLightCtrl,'intensity',0,5).onChange(function (e) {
            highLight.intensity = e;
        });

        //相机控制器
        cameraCtrl = new THREE.OrbitControls(camera,renderer.domElement);
        cameraCtrl.enableKeys = false;
        cameraCtrl.enableDamping = true;
        cameraCtrl.dampingFactor = 0.5;
        cameraCtrl.addEventListener('change', function () {
            pointLight.position.copy(new THREE.Vector3(camera.position.x / 3 + 20,camera.position.y / 3 + 20,camera.position.z / 3));
            highLight.position.copy(camera.position);
            renderer.render(scene, camera);
        });
    }

    //  设置光照
    function initLight() {
      pointLight = new THREE.PointLight("#ffffff");
      pointLight.caseShadow = false;
      pointLight.intensity = pointLightCtrl.intensity;
      pointLight.distance = pointLightCtrl.distance;
      var cameraPos = camera.position;
      pointLight.position.set(cameraPos.x / 3 + 20,cameraPos.y / 3 + 20,cameraPos.z / 3 + 20);

      highLight = new THREE.PointLight('#ffffff');
      highLight.caseShadow = false;
      highLight.distance = highLightCtrl.distance;
      highLight.intensity = highLightCtrl.intensity;
      highLight.position.copy(camera.position);

      scene.add(pointLight);
      scene.add(highLight);
    }

//            帧数计算器
    function initStats() {
        stats = new Stats();
        var statsStyle = stats.domElement.style;
        statsStyle.position = 'absolute';
        statsStyle.left = '0px';
        statsStyle.top = '0px';

        document.getElementById('app').appendChild(stats.domElement);
    }

    function animate() {
        render();
        requestAnimationFrame(animate);
    }

//      动画循环
    function render() {
        stats.update();
        group.rotation.y -= controls.rotaSpeed;
        group.scale.set(controls.globeScaleRate, controls.globeScaleRate, controls.globeScaleRate);
        TWEEN.update();
        renderer.render(scene, camera);
    }

//        地球类
    function Earth(opts) {
        var defaultOpts = {
            radius: globeRadius,
            horFragment: 80,
            verFragment: 80,
            texture: false,
            textureUrl: null
        };
        this.opts = extend(defaultOpts, opts);

        var geo = new THREE.SphereGeometry(this.opts.radius, this.opts.horFragment, this.opts.verFragment);
        if (this.opts.texture) {
            loader.load(this.opts.textureUrl, function (texture) {
                earthMaterial = new THREE.MeshLambertMaterial({
                  map: texture,
                  overdraw: 0.5,
                  transparent:controls.earthTransparent,
                  opacity:controls.earthOpacity
                });
                earthMaterial.needsUpdate = true;
                mesh = new THREE.Mesh(geo, earthMaterial);
                group.add(mesh);
            });
        } else {
            earthMaterial = new THREE.MeshBasicMaterial({color: 0x000000});
            mesh = new THREE.Mesh(geo, earthMaterial);
            group.add(mesh);
        }
    }

    //    加载数据
    function requestData() {
      // 请求所有航线数据 暂时存储
      record('请求数据 routes.json...');
      fetch('./data/routes.json').then(res => {
        res.json()
        .then(data => {routesData = data})
        .then(() => {
        record('请求数据 airlines.json...');
        fetch('./data/airlines.json').then(res => {
            return res.json()
        }).then(airlines => {
            airlinesData = airlines;
            const airlineNum = 7;
            const controls = {};
            pointsLinesGUI = new dat.GUI();
            let folder = pointsLinesGUI.addFolder('airlines');
            let airlineWorker = new Worker('./workers/airlines.js');
            airlineWorker.postMessage({airlines,routesData});
            airlineWorker.onmessage = (e) => {
              let sortByAirline = e.data.sortByAirline;
              airlineIDRealationMap = e.data.airlineIDRealationMap;
              for (let i = 0; i < airlineNum; i++) {
                  let airlineId = sortByAirline[i];
                  let airline = airlines[airlineId];
                  let airlineName = airline[1];
                  controls[airlineName] = () => {
                      showAirlineInfo(airlineId);
                      drawRouteByCondition('airline', airlineId);
                  };
                  folder.add(controls, airlineName);
              }
            }
        }).then(() => {
          // 请求所有机场数据并列表
          record('请求数据 airports.json...');
          fetch('./data/airports.json').then((res) => {
              return res.json();
          }).then(airports => {
              // 将数据传给worker处理并返回结果
              airportsData = airports;
              record('处理数据 airports.json...');
              let airportsWorker = new Worker('./workers/airports.js');
              airportsWorker.postMessage({airports, globalRadius: globeRadius,routesData});
              airportsWorker.onmessage = e => {
                  let data = e.data;
                  let folder = pointsLinesGUI.addFolder('airports');
                  let{
                    divideByCountry:divByCountry,
                    sortedByCountry,
                    divBySrcAirport,
                    sortByRoutesNum
                  } = data.airports;
                  allAirportsPos = data.airports.allAirportsPos;
                  idRelationMap = data.airports.idRelationMap;
                  const controls = {};
                  const countriesNum = 7;

                  for (let i = 0; i < countriesNum; i++) {
                      controls[sortedByCountry[i]] = () => {
                          drawAirportsByCountry(divByCountry, sortedByCountry[i]);
                      };
                      folder.add(controls, sortedByCountry[i]);
                  }
                  record('绘制机场...');
                  drawAirports(allAirportsPos,divBySrcAirport,sortByRoutesNum);
              };
          });
        });
      });
    });
    }

    function record(text) {
      $('.record').append('<li>'+text+'</li>');
      if($('.record').height() >= $('.record-container').height()){
        $('.record li:first-child').remove();
      }
    }
    window.log = record;

    function initApp() {
        record('初始化3D环境...');
        initThree();
        record('初始化相机...');
        initCamera();
        record('初始化参数控制器...');
        initControls();
        record('初始化帧数计算器...');
        initStats();
        record('加载地球模型...');
        new Earth({
            radius: globeRadius,
            texture: true,
            textureUrl: './texture/lala.jpg'
        });
        record('初始化光照...');
        initLight();
        record('初始化搜索栏...');
        initSearch();
        initHighcharts();
        record('请求数据...');
        requestData();
        animate();
    }
    function initHighcharts() {
      Highcharts.theme = {
        chart: {
            backgroundColor: 'rgba(0,0,0,0)',
        },
        title: {
            style: {
                color: '#fff',
                font: 'bold 20px "Trebuchet MS", Verdana, sans-serif'
            }
        },
        subtitle: {
            style: {
                color: '#cccccc',
                font: 'bold 12px "Trebuchet MS", Verdana, sans-serif'
            }
        }
      };
      // 使主题配置生效
      Highcharts.setOptions(Highcharts.theme);
    }

    window.onload = initApp;
    window.addEventListener('resize', onWindowResize, false);
    window.addEventListener('click', onDocumentClick, false);
    window.addEventListener('mousemove', onDocumentMouseMove, false);

//        窗口大小变化刷新
    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight - 2);
    }

    function onDocumentMouseMove(e) {
      e.preventDefault();
      e.stopPropagation();
      if(!particleSystem){return;}
      var mouse = new THREE.Vector2();
      mouse.x =  ( e.clientX / renderer.domElement.width  ) * 2 - 1;
      mouse.y = -( e.clientY / renderer.domElement.height ) * 2 + 1;
      raycaster.setFromCamera( mouse, camera );
      var intersects = raycaster.intersectObject( particleSystem );
      if (intersects.length > 0) {
          intersects = intersects.sort( function( a, b ) {
              return a.distanceToRay - b.distanceToRay;
          });
          var particle = intersects[0];
          var airportId = particle.object.userData.particles[particle.index].idx;
          airportsTips(e,airportsData[airportId]);//使用具体数据时转成realID
      }else{
        tips && document.getElementById('app').removeChild(tips);
        tips = null;
      }
    }

    function onDocumentClick(e) {
        e.preventDefault();
        var mouse = new THREE.Vector2();
        mouse.x =  ( e.clientX / renderer.domElement.width  ) * 2 - 1;
        mouse.y = -( e.clientY / renderer.domElement.height ) * 2 + 1;
        raycaster.setFromCamera(mouse, camera );
        var intersects = raycaster.intersectObject( particleSystem );
        if (intersects.length > 0) {
            //console.log( 'intersects', intersects );
            // Points.js::raycast() doesn't seem to sort this correctly atm,
            // but how many points are found depends on the threshold set
            // on the raycaster as well
            intersects = intersects.sort( function( a, b ) {
                return a.distanceToRay - b.distanceToRay;
            });
            var particle = intersects[0];
            var airportId = particle.object.userData.particles[particle.index].originIndex;
            record('选中 ' + airportId + ' 号机场');
            drawRouteByCondition('srcAirport', airportId);
            showAirportInfo(idRelationMap[airportId]);
            // console.log( 'got a click on particle',
            //    particle.object.userData.particles[ particle.index ].name );
            //
            // // Change the color of this particular particle
            // particle.object.geometry.colors[ particle.index ].setHex( Math.random() * 0xff0000 );
            // particleSystem.colorsNeedUpdate = true;
        }
    }

    function drawAirports(airportsCoor,divBySrcAirport,sortByRoutesNum) {
        var geometry = new THREE.Geometry();
        pointMaterial = new THREE.PointsMaterial({
            size: controls.pointSize,
            map: loader.load(
                "./texture/particle.png"
            ),
            blending: THREE.AdditiveBlending,
            transparent: false,
            vertexColors:THREE.VertexColors
        });
        particleSystem = new THREE.Points(geometry,pointMaterial);
        particleSystem.userData.particles = [];
        airportsCoor.forEach(function (airport) {
            var particle = new THREE.Vector3(airport.coor.x, airport.coor.y, airport.coor.z);
            geometry.vertices.push(particle);
            geometry.colors.push(new THREE.Color(0xffffff));

            // divBySrcAirport分类时是根据virtualID分类的
            // 这里根据divBySrcAirport得出航线数量 也应该用virtualID
            // var srcAirport = divBySrcAirport[airport.idx];
            var srcAirport = divBySrcAirport[airport.originIndex];
            var routesNum = 0;
            if(srcAirport == 'NULL' || srcAirport == undefined){
              routesNum = 0;
            }else{
              routesNum = srcAirport.length;
            }
            particleSystem.userData.particles.push({
              idx:airport.idx,
              originIndex:airport.originIndex,// 使用virtualID
              routesNum: routesNum
            });
        });
        // 将包含所有机场顶点位置信息的数组保存一份 筛选机场时需要用
        // 需要复制一份 不然保存的是引用
        allAirportsVertices = geometry.vertices.slice(0);
        group.add(particleSystem);
    }
    function drawAirportsByCountry(data,country){
        var geometry = new THREE.Geometry();
        var material = new THREE.PointsMaterial({
          color: 0xFFFFFF,
          size: 3,
          map: loader.load(
            "./texture/particle.png"
          ),
          blending: THREE.AdditiveBlending,
          transparent: true
        });
        if(!particleSystem){
            particleSystem = new THREE.Points(geometry, material);
            particleSystem.name = "cumeda";
            particleSystem.userData.particles = [];
            group.add(particleSystem);
        }

        // 由于divByCountry使用divideArrayByItemWithIdx 这里的airport格式为{coor:{x,y,z},idx}
        data[country].forEach(function (airport) {
            var particle = new THREE.Vector3(airport.coor.x, airport.coor.y, airport.coor.z);
            geometry.vertices.push(particle);
            // geometry.colors.push(new THREE.Color(Math.random() * 0xffffff));

            particleSystem.userData.particles.push( airport.idx );
        });
    }

    function rgbToHex(rgb) {
        // rgb(x, y, z)
        var color = rgb.toString().match(/\d+/g); // 把 x,y,z 推送到 color 数组里
        var hex = "#";
        for (var i = 0; i < 3; i++) {
            // 'Number.toString(16)' 是JS默认能实现转换成16进制数的方法.
            // 'color[i]' 是数组，要转换成字符串.
            // 如果结果是一位数，就在前面补零。例如： A变成0A
            hex += ("0" + Number(color[i]).toString(16)).slice(-2);
        }
        return hex;
    }
    const availableColors = [
        '(171, 217, 233)',
        '(253, 174, 97)',
        '(244, 109, 67)',
        '(255, 115, 136)',
        '(186, 247, 86)',
        '(220, 50, 50)'
    ];
    var i = 0;
    function drawRoutes(type,query,linesProps,statistics){
      record('绘制航线 ' + type + ' ' + query);
      window.mygroup = group;
      showOneAirportRoutesInfo(statistics);
        var color = rgbToHex(availableColors[i]);
        var opacity = 0.6;
        var linewidth = 3;
        i++; i = i % 6;
        let line_positions = linesProps.linePos;
        // let colors = linesProps.colors;
        var geometry = new THREE.BufferGeometry();
        var material = new THREE.LineBasicMaterial({
            color: color,
            linewidth:linewidth,
            transparent: true,
            opacity: opacity,
            depthTest: true,
            depthWrite: false
        });
        // geometry.addAttribute('position', new THREE.BufferAttribute(line_positions, 3));
        // geometry.addAttribute('color', new THREE.BufferAttribute(colors, 3));


        buffer_geometry = new THREE.BufferGeometry();
        // buffer_geometry.addAttribute('color', new THREE.BufferAttribute(colors, 3));
        buffer_geometry.addAttribute('position',new THREE.BufferAttribute(new Float32Array(line_positions.length),3));
        positions = buffer_geometry.attributes.position.array;
        tween = new TWEEN.Tween(positions).to(line_positions,2000);
        tween.easing(TWEEN.Easing.Cubic.Out);

        var pointIdx = 0;

        tween.onUpdate(function() {
            positions[ pointIdx * 6 ] = line_positions[ pointIdx * 6 ];
            positions[ pointIdx * 6 + 1 ] = line_positions[ pointIdx * 6 + 1];
            positions[ pointIdx * 6 + 2] = line_positions[ pointIdx * 6 + 2];
            positions[ pointIdx * 6 + 3] = line_positions[ pointIdx * 6 + 3];
            positions[ pointIdx * 6 + 4] = line_positions[ pointIdx * 6 + 4];
            positions[ pointIdx * 6 + 5] = line_positions[ pointIdx * 6 + 5];
            line.geometry.attributes.position.needsUpdate = true;
            pointIdx++;
        });
        tween.start();

        buffer_geometry.computeBoundingSphere();
        // Line: parameter LinePieces no longer supported. Created LineSegments instead.
        // group.add(new THREE.Line(geometry, material, THREE.LineSegments));
        line = new THREE.Line(buffer_geometry, material, THREE.LineSegments);
        // line.name = query;
        line.userData = {type:type,id:query};
        group.add(line);
        if(type!== 'allPaths')
          routeList(type,query,color,opacity,linewidth);
    }
    function routeList(type,query,color,opacity,linewidth) {
      if(!$('.route-list').html()){
        routeListGui = new dat.GUI({ autoPlace: false });
        $('.route-list').append(routeListGui.domElement);
      }
      var routeListFolder = routeListGui.addFolder(type + query);
      routeListMap.color = color;
      routeListMap.opacity = opacity;
      routeListMap.linewidth = linewidth;
      routeListMap.draw = true;
      routeListFolder.addColor(routeListMap,'color').onChange(function(val){
        var indexInGroup = hasDraw(group,'Line',type,query);
        group.children[indexInGroup].material.color.setHex(parseInt(val.slice(1),16));
      });
      routeListFolder.add(routeListMap,'draw').onChange(function(val){
        var indexInGroup = hasDraw(group,'Line',type,query);
        group.children[indexInGroup].visible = val;
      });
      routeListFolder.add(routeListMap,'opacity',0,1).onChange(function(val){
        var indexInGroup = hasDraw(group,'Line',type,query);
        group.children[indexInGroup].material.opacity = val;
      });
    }
    function drawRouteByCondition(type,query){
      record('计算航线 ' + type + ' ' + query);
      var hasDrawThisType = hasDraw(group,'Line',type,query);
      if(hasDrawThisType !== -1){
        // removeRoute(hasDrawThisType.geometry,type,query);
        // group.children.splice(hasDrawThisType,1);
        group.children[hasDrawThisType].visible = !group.children[hasDrawThisType].visible;;
        return;
      }
      let routesWorker = new Worker('./workers/routes.js');
      routesWorker.postMessage({
          airports:airportsData,
          routes:routesData,
          globalRadius:globeRadius,
          condition:{
              type:type,
              query:query
          },
          idRelationMap
      });
      routesWorker.onmessage = e => {
          let data = e.data;
          data.linesProps && drawRoutes(type,query,data.linesProps,data.statistics);
          if(type === 'airline'){
            $('#info-airport').html('');// 画航班曲线则清空机场信息
          }
      };
    }

    function showOneAirportRoutesInfo(statistics) {
      if(!statistics){return;}
      // 处理统计数据以符合highcharts数据格式
      // [['country',routeNumber]]
      var formateCountry = [];
      Object.keys(statistics.country).forEach(function(country){
        formateCountry.push([country,statistics.country[country].length]);
      });
      window.formateCountry = formateCountry;
      $('#pie-container').highcharts({
        chart: {
            type: 'pie',
            options3d: {
                enabled: true,
                alpha: 45
            }
        },
        title: {
            text: '航线统计'
        },
        subtitle: {
            text: '航线数量：' + statistics.routesNum + ' 目的机场国家数量：' + Object.keys(statistics.country).length
        },
        pane:{
          background:[{
            backgroundColor:'rgb(0,0,0)'
          }]
        },
        plotOptions: {
            pie: {
                innerSize: 100,
                depth: 45
            }
        },
        series: [{
            name: '目的机场数量',
            data:formateCountry
        }]
    });
    }

    function airportsTips(e,airport) {
        if(!tips){
          tips = document.createElement('table');
          tips.className = 'tips';
          document.getElementById('app').appendChild(tips);
        }
        tips.style.left = e.clientX + 15 + 'px';
        tips.style.top = e.clientY + 2 + 'px';

        var template = `
          <tbody>
          <tr><td class="airport-name"  colspan="2">${airport[1].toUpperCase()}</td></tr>
          <tr>
            <td class="country-name">${airport[3].toUpperCase()}</td>
            <td class="airport-latlong">
            Longitude:${airport[7].toFixed(5)}<br/>Latitude:${airport[6].toFixed(5)}
            </td>
          </tr>
          </tbody>
        `;
        tips.innerHTML = template;
    }

    // 使用realID
    function showAirportInfo(airportId) {
      $('#info-airline').html('');
      var info = airportsData[airportId];
      var infoWrapper = document.getElementById('info-airport');
      var template = `
      <p><span>序号：</span>${info[0]}</p>
      <p><span>名字：</span>${info[1]}</p>
      <p><span>城市：</span>${info[2]}</p>
      <p><span>国家：</span>${info[3]}</p>
      <p><span>IATA：</span>${info[4]}</p>
      <p><span>ICAO：</span>${info[5]}</p>
      <p><span>纬度：</span>${info[6]}</p>
      <p><span>经度：</span>${info[7]}</p>
      `;
      infoWrapper.innerHTML = template;
    }
    function showAirlineInfo(airlineId) {
      $('#info-airport').html('');
      var info = airlinesData[airlineId];
      var infoWrapper = document.getElementById('info-airline');
      var template = `
      <p><span>序号：</span>${info[0]}</p>
      <p><span>名字：</span>${info[1]}</p>
      <p><span>别名：</span>${info[2]}</p>
      <p><span>国家：</span>${info[6]}</p>
      <p><span>IATA：</span>${info[3]}</p>
      <p><span>ICAO：</span>${info[4]}</p>
      <p><span>是否可用：</span>${info[6] == 'Y'?'是':'否'}</p>
      `;
      infoWrapper.innerHTML = template;
    }

    /**
     * 判断targetGroup中是否已经含有类型type 序号id的元素
     * @param targetGroup {THREE.Group} 目标group
     * @param type {String} 'Mesh' 或 'Line' 等
     * @param subType {String} 'Airline' 或 'Airport'
     * @param id {Number} AirlineID 或 AirportID
     * @returns {THREE.Obejct3D} 返回查找到的元素或null
     */
    function hasDraw(targetGroup,type,subType,id) {
      var children = targetGroup.children;// 数组[{Mesh},{Points},{Line}]
      for (var i = 0; i < children.length; i++) {
        if(children[i].type === type
        && children[i].userData.type === subType
        && children[i].userData.id === id){
          return i;
        }
      }
      return -1;
    }
    /**
     * 删除targetGroup中是类型type 序号id的元素
     * @param targetGeometry {THREE.Geometry} 目标几何体
     * @param type {String} 'Airline' 或 'srcAirport'
     * @param id {Number} AirlineID 或 srcAirportID
     */
    function removeRoute(targetGeometry) {
      var positions = targetGeometry.attributes.position.array;
      tween = new TWEEN.Tween(positions).to([],2000);
      tween.easing(TWEEN.Easing.Quadratic.In);
      var pointIdx = 0;

      tween.onUpdate(function() {
          // positions[ pointIdx * 6 ] = 0;
          // positions[ pointIdx * 6 + 1 ] = 0;
          // positions[ pointIdx * 6 + 2] = 0;
          positions.subarray(3,positions.length - 1);
          targetGeometry.attributes.position.needsUpdate = true;
          pointIdx++;
      });
      tween.start();
      targetGeometry.computeBoundingSphere();
    }
});
