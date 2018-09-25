/* global d3, document */

/* jshint latedef:nofunc */


var time = null;
function Neo4jD3(_selector, _options) {
    let container, graph, info, node, nodes, relationship, relationshipOutline, relationshipOverlay, relationshipText,
        relationships, selector, simulation, svg, svgNodes, svgRelationships, svgScale, svgTranslate,
        justLoaded = false,
        numClasses = 0,
        options = {
            arrowSize: 4,
            highlight: undefined,
            infoPanel: true,
            infoSelector: true,
            minCollision:50,
            D3Data: undefined,
            nodeOutlineFillColor: undefined,
            nodeRadius: 25,
            relationshipColor: '#a5abb6',
            zoomFit: false,
            iconMap: fontAwesomeIcons(),
            icons: undefined,
            imageMap: {},
            images: undefined
        },
        VERSION = '0.0.1';

    function appendGraph(container) {
        svg = container.append('svg')
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('class', 'neo4jd3-graph')
            .call(d3.zoom().on('zoom', function () {
                let scale = d3.event.transform.k,
                    translate = [d3.event.transform.x, d3.event.transform.y];

                if (svgTranslate) {
                    translate[0] += svgTranslate[0];
                    translate[1] += svgTranslate[1];
                }

                if (svgScale) {
                    scale *= svgScale;
                }

                svg.attr('transform', 'translate(' + translate[0] + ', ' + translate[1] + ') scale(' + scale + ')');
            }))
            .on('dblclick.zoom', null)
            .append('g')
            .attr('width', '100%')
            .attr('height', '100%');

        svgRelationships = svg.append('g')
            .attr('class', 'relationships');

        svgNodes = svg.append('g')
            .attr('class', 'nodes');
    }

    function appendImageToNode(node) {
        return node.append('image')
            .attr('height', function(d) {
                return '24px';
            })
            .attr('x', function(d) {
                return '5px';
            })
            .attr('xlink:href', function(d) {
                return image(d);
            })
            .attr('y', function(d) {
                return '5px';
            })
            .attr('width', function(d) {
                return '24px';
            });
    }

    function appendInfoPanel(container) {
        return container.append('div')
            .attr('class', 'neo4jd3-info');
    }

    function appendInfoElement(cls, isNode, property, value) {
        console.log(cls);
        let elem = info.append('label');

        elem.attr('class', cls)
            .html('<strong>' + property + '</strong>' + (value ? (': ' + value) : ''));

        if (!value) {
            elem.style('background-color', function (d) {
                return options.nodeOutlineFillColor ? options.nodeOutlineFillColor : (isNode ? class2color(property) : defaultColor());
            })
                .style('border-color', function (d) {
                    return options.nodeOutlineFillColor ? class2darkenColor(options.nodeOutlineFillColor) : (isNode ? class2darkenColor(property) : defaultDarkenColor());
                })
                .style('color', function (d) {
                    return options.nodeOutlineFillColor ? class2darkenColor(options.nodeOutlineFillColor) : '#fff';
                });
        }
    }

    function appendInfoElementClass(cls, node) {
        appendInfoElement(cls, true, node);
    }

    function appendInfoElementProperty(cls, property, value) {
        appendInfoElement(cls, false, property, value);
    }

    function appendInfoElementRelationship(cls, relationship) {
        appendInfoElement(cls, false, relationship);
    }

    function appendNode() {
        return node.enter()
            .append('g')
            // .attr("transform", "translate("+ svg.node().parentElement.parentElement.clientWidth / 2 +","+svg.node().parentElement.parentElement.clientHeight / 2 +")")  //no forceCenter use x,y-transform make it center

            .attr('class', function (d) {
                let highlight, i,
                    classes = 'node',
                    label = d.labels[0];

                if (image(d)) {
                    classes += ' node-image';
                }

                if (options.highlight) {
                    for (i = 0; i < options.highlight.length; i++) {
                        highlight = options.highlight[i];

                        if (d.labels[0] === highlight.class && d.properties[highlight.property] === highlight.value) {
                            classes += ' node-highlighted';
                            break;
                        }
                    }
                }

                return classes;
            })
            .on('click', function (d) {
                clearTimeout(time);
                //执行延时
                time = setTimeout(function(){
                    d.fx = d.fy = null;

                    if (typeof options.onNodeClick === 'function') {
                        options.onNodeClick(d);
                    }
                },300);


            })

            .on('dblclick', function (d) {
                clearTimeout(time);
                // stickNode(d);

                if (typeof options.onNodeDoubleClick === 'function') {
                    options.onNodeDoubleClick(d);
                }

            })
            .on('mouseenter', function (d) {
                if (info) {
                    //updateInfo(d);
                }

                if (typeof options.onNodeMouseEnter === 'function') {
                    options.onNodeMouseEnter(d);
                }
            })
            .on('mouseleave', function (d) {
                if (info) {
                    //clearInfo(d);
                }

                if (typeof options.onNodeMouseLeave === 'function') {
                    options.onNodeMouseLeave(d);
                }
            })
            .call(d3.drag()
                .on('start', dragStarted)
                .on('drag', dragged)
                .on('end', dragEnded));
    }

    function appendNodeToGraph() {
        let n = appendNode();

        appendRingToNode(n);
        appendOutlineToNode(n);
        appendTextToNode(n);

        if (options.images) {
            appendImageToNode(n);
        }

        return n;
    }
    var nodescolor = {};

    function appendOutlineToNode(node) {
        return node.append('circle')
            .attr('class', 'outline')
            .attr('r', options.nodeRadius)
            .style('fill', function (d) {
                let tag = 0;
                $.each(nodescolor,function (i,val) {
                    if(nodescolor[i]===class2color(d.labels[0])) tag=1;
                });
                if(tag===0) {
                    nodescolor[d.labels[0]]=class2color(d.labels[0])
                }
                return options.nodeOutlineFillColor ? options.nodeOutlineFillColor : class2color(d.labels[0]);

            })
            .style('stroke', function (d) {
                return options.nodeOutlineFillColor ? class2darkenColor(options.nodeOutlineFillColor) : class2darkenColor(d.labels[0]);
            })
            .append('title').text(function (d) {
                return toString(d);
            });
    }

    function appendRingToNode(node) {
        return node.append('circle')
            .attr('class', 'ring')
            .attr('r', options.nodeRadius * 1.16)
            .append('title').text(function (d) {
                return toString(d);
            });
    }

    function appendTextToNode(node) {
        return node.append('text')
            .attr('class', 'text-overflow')
            .attr('fill', '#ffffff')
            .attr('font-size', function (d) {
                //return icon(d) ? (options.nodeRadius + 'px') : '10px';
                return '13px';
            })
            .attr('pointer-events', 'none')
            .attr('text-anchor', 'middle')
            .attr('y', function (d) {
                //return icon(d) ? (parseInt(Math.round(options.nodeRadius * 0.32)) + 'px') : '4px';
                return '4px';
            })
            .html(function (d) {
                return d.name ? d.name : "";
            });
    }


    function appendRelationship() {
        return relationship.enter()
            .append('g')
            .attr('class', 'relationship')
            .on('dblclick', function (d) {
                if (typeof options.onRelationshipDoubleClick === 'function') {
                    options.onRelationshipDoubleClick(d);
                }
            })
            .on('mouseenter', function (d) {
                if (info) {
                    //updateInfo(d);
                }
            });
    }
    function appendOutlineToRelationship(r) {

        return r.append('path')
            .attr('class', 'outline')
            .attr('fill', '#a5abb6')
            .attr('stroke', 'none');

    }

    function appendOverlayToRelationship(r) {
        return r.append('path')
            .attr('class', 'overlay');
    }

    function appendTextToRelationship(r) {
        return r.append('text')
            .attr('class', 'text')
            .attr('fill', '#000000')
            .attr('font-size', '8px')
            .attr('pointer-events', 'none')
            .attr('text-anchor', 'middle')
            .text(function (d) {
                return d.type;
            });
    }

    function appendRelationshipToGraph() {
        let relationship = appendRelationship(),
            text = appendTextToRelationship(relationship),
            outline = appendOutlineToRelationship(relationship),
            overlay = appendOverlayToRelationship(relationship);

        return {
            outline: outline,
            overlay: overlay,
            relationship: relationship,
            text: text
        };
    }

    function class2color(cls) {
        // console.log(cls);
        // console.log(labelProperty);
        let color = "#337ab7";
        /*let color = classes2colors[cls];

        if (!color) {
//            color = options.colors[Math.min(numClasses, options.colors.length - 1)];
            color = options.colors[numClasses % options.colors.length];
            classes2colors[cls] = color;
            numClasses++;
        }*/
        for (let i = 0; i < labelProperty.length; i++){
            if(cls === labelProperty[i].name){
                color = labelProperty[i].color;
            }
        }

        return color;
    }

    function class2darkenColor(cls) {
        return d3.rgb(class2color(cls)).darker(1);
    }

    function clearInfo() {
        info.html('');
    }

    function contains(array, id) {
        let filter = array.filter(function (elem) {
            return elem.id === id;
        });

        return filter.length > 0;
    }

    function defaultColor() {
        return options.relationshipColor;
    }

    function defaultDarkenColor() {
        return d3.rgb(options.colors[options.colors.length - 1]).darker(1);
    }

    function dragEnded(d) {
        if (!d3.event.active) {
            simulation.alphaTarget(0);
        }

        if (typeof options.onNodeDragEnd === 'function') {
            options.onNodeDragEnd(d);
        }
    }

    function dragged(d) {
        stickNode(d);
    }

    function dragStarted(d) {
        if (!d3.event.active) {
            simulation.alphaTarget(0.3).restart();
        }

        d.fx = d.x;
        d.fy = d.y;

        if (typeof options.onNodeDragStart === 'function') {
            options.onNodeDragStart(d);
        }
    }

    function extend(obj1, obj2) {
        let obj = {};

        merge(obj, obj1);
        merge(obj, obj2);

        return obj;
    }

    function fontAwesomeIcons() {
        return {'glass':'f000','music':'f001','search':'f002','envelope-o':'f003','heart':'f004','star':'f005','star-o':'f006','user':'f007','film':'f008','th-large':'f009','th':'f00a','th-list':'f00b','check':'f00c','remove,close,times':'f00d','search-plus':'f00e','search-minus':'f010','power-off':'f011','signal':'f012','gear,cog':'f013','trash-o':'f014','home':'f015','file-o':'f016','clock-o':'f017','road':'f018','download':'f019','arrow-circle-o-down':'f01a','arrow-circle-o-up':'f01b','inbox':'f01c','play-circle-o':'f01d','rotate-right,repeat':'f01e','refresh':'f021','list-alt':'f022','lock':'f023','flag':'f024','headphones':'f025','volume-off':'f026','volume-down':'f027','volume-up':'f028','qrcode':'f029','barcode':'f02a','tag':'f02b','tags':'f02c','book':'f02d','bookmark':'f02e','print':'f02f','camera':'f030','font':'f031','bold':'f032','italic':'f033','text-height':'f034','text-width':'f035','align-left':'f036','align-center':'f037','align-right':'f038','align-justify':'f039','list':'f03a','dedent,outdent':'f03b','indent':'f03c','video-camera':'f03d','photo,image,picture-o':'f03e','pencil':'f040','map-marker':'f041','adjust':'f042','tint':'f043','edit,pencil-square-o':'f044','share-square-o':'f045','check-square-o':'f046','arrows':'f047','step-backward':'f048','fast-backward':'f049','backward':'f04a','play':'f04b','pause':'f04c','stop':'f04d','forward':'f04e','fast-forward':'f050','step-forward':'f051','eject':'f052','chevron-left':'f053','chevron-right':'f054','plus-circle':'f055','minus-circle':'f056','times-circle':'f057','check-circle':'f058','question-circle':'f059','info-circle':'f05a','crosshairs':'f05b','times-circle-o':'f05c','check-circle-o':'f05d','ban':'f05e','arrow-left':'f060','arrow-right':'f061','arrow-up':'f062','arrow-down':'f063','mail-forward,share':'f064','expand':'f065','compress':'f066','plus':'f067','minus':'f068','asterisk':'f069','exclamation-circle':'f06a','gift':'f06b','leaf':'f06c','fire':'f06d','eye':'f06e','eye-slash':'f070','warning,exclamation-triangle':'f071','plane':'f072','calendar':'f073','random':'f074','comment':'f075','magnet':'f076','chevron-up':'f077','chevron-down':'f078','retweet':'f079','shopping-cart':'f07a','folder':'f07b','folder-open':'f07c','arrows-v':'f07d','arrows-h':'f07e','bar-chart-o,bar-chart':'f080','twitter-square':'f081','facebook-square':'f082','camera-retro':'f083','key':'f084','gears,cogs':'f085','comments':'f086','thumbs-o-up':'f087','thumbs-o-down':'f088','star-half':'f089','heart-o':'f08a','sign-out':'f08b','linkedin-square':'f08c','thumb-tack':'f08d','external-link':'f08e','sign-in':'f090','trophy':'f091','github-square':'f092','upload':'f093','lemon-o':'f094','phone':'f095','square-o':'f096','bookmark-o':'f097','phone-square':'f098','twitter':'f099','facebook-f,facebook':'f09a','github':'f09b','unlock':'f09c','credit-card':'f09d','feed,rss':'f09e','hdd-o':'f0a0','bullhorn':'f0a1','bell':'f0f3','certificate':'f0a3','hand-o-right':'f0a4','hand-o-left':'f0a5','hand-o-up':'f0a6','hand-o-down':'f0a7','arrow-circle-left':'f0a8','arrow-circle-right':'f0a9','arrow-circle-up':'f0aa','arrow-circle-down':'f0ab','globe':'f0ac','wrench':'f0ad','tasks':'f0ae','filter':'f0b0','briefcase':'f0b1','arrows-alt':'f0b2','group,users':'f0c0','chain,link':'f0c1','cloud':'f0c2','flask':'f0c3','cut,scissors':'f0c4','copy,files-o':'f0c5','paperclip':'f0c6','save,floppy-o':'f0c7','square':'f0c8','navicon,reorder,bars':'f0c9','list-ul':'f0ca','list-ol':'f0cb','strikethrough':'f0cc','underline':'f0cd','table':'f0ce','magic':'f0d0','truck':'f0d1','pinterest':'f0d2','pinterest-square':'f0d3','google-plus-square':'f0d4','google-plus':'f0d5','money':'f0d6','caret-down':'f0d7','caret-up':'f0d8','caret-left':'f0d9','caret-right':'f0da','columns':'f0db','unsorted,sort':'f0dc','sort-down,sort-desc':'f0dd','sort-up,sort-asc':'f0de','envelope':'f0e0','linkedin':'f0e1','rotate-left,undo':'f0e2','legal,gavel':'f0e3','dashboard,tachometer':'f0e4','comment-o':'f0e5','comments-o':'f0e6','flash,bolt':'f0e7','sitemap':'f0e8','umbrella':'f0e9','paste,clipboard':'f0ea','lightbulb-o':'f0eb','exchange':'f0ec','cloud-download':'f0ed','cloud-upload':'f0ee','user-md':'f0f0','stethoscope':'f0f1','suitcase':'f0f2','bell-o':'f0a2','coffee':'f0f4','cutlery':'f0f5','file-text-o':'f0f6','building-o':'f0f7','hospital-o':'f0f8','ambulance':'f0f9','medkit':'f0fa','fighter-jet':'f0fb','beer':'f0fc','h-square':'f0fd','plus-square':'f0fe','angle-double-left':'f100','angle-double-right':'f101','angle-double-up':'f102','angle-double-down':'f103','angle-left':'f104','angle-right':'f105','angle-up':'f106','angle-down':'f107','desktop':'f108','laptop':'f109','tablet':'f10a','mobile-phone,mobile':'f10b','circle-o':'f10c','quote-left':'f10d','quote-right':'f10e','spinner':'f110','circle':'f111','mail-reply,reply':'f112','github-alt':'f113','folder-o':'f114','folder-open-o':'f115','smile-o':'f118','frown-o':'f119','meh-o':'f11a','gamepad':'f11b','keyboard-o':'f11c','flag-o':'f11d','flag-checkered':'f11e','terminal':'f120','code':'f121','mail-reply-all,reply-all':'f122','star-half-empty,star-half-full,star-half-o':'f123','location-arrow':'f124','crop':'f125','code-fork':'f126','unlink,chain-broken':'f127','question':'f128','info':'f129','exclamation':'f12a','superscript':'f12b','subscript':'f12c','eraser':'f12d','puzzle-piece':'f12e','microphone':'f130','microphone-slash':'f131','shield':'f132','calendar-o':'f133','fire-extinguisher':'f134','rocket':'f135','maxcdn':'f136','chevron-circle-left':'f137','chevron-circle-right':'f138','chevron-circle-up':'f139','chevron-circle-down':'f13a','html5':'f13b','css3':'f13c','anchor':'f13d','unlock-alt':'f13e','bullseye':'f140','ellipsis-h':'f141','ellipsis-v':'f142','rss-square':'f143','play-circle':'f144','ticket':'f145','minus-square':'f146','minus-square-o':'f147','level-up':'f148','level-down':'f149','check-square':'f14a','pencil-square':'f14b','external-link-square':'f14c','share-square':'f14d','compass':'f14e','toggle-down,caret-square-o-down':'f150','toggle-up,caret-square-o-up':'f151','toggle-right,caret-square-o-right':'f152','euro,eur':'f153','gbp':'f154','dollar,usd':'f155','rupee,inr':'f156','cny,rmb,yen,jpy':'f157','ruble,rouble,rub':'f158','won,krw':'f159','bitcoin,btc':'f15a','file':'f15b','file-text':'f15c','sort-alpha-asc':'f15d','sort-alpha-desc':'f15e','sort-amount-asc':'f160','sort-amount-desc':'f161','sort-numeric-asc':'f162','sort-numeric-desc':'f163','thumbs-up':'f164','thumbs-down':'f165','youtube-square':'f166','youtube':'f167','xing':'f168','xing-square':'f169','youtube-play':'f16a','dropbox':'f16b','stack-overflow':'f16c','instagram':'f16d','flickr':'f16e','adn':'f170','bitbucket':'f171','bitbucket-square':'f172','tumblr':'f173','tumblr-square':'f174','long-arrow-down':'f175','long-arrow-up':'f176','long-arrow-left':'f177','long-arrow-right':'f178','apple':'f179','windows':'f17a','android':'f17b','linux':'f17c','dribbble':'f17d','skype':'f17e','foursquare':'f180','trello':'f181','female':'f182','male':'f183','gittip,gratipay':'f184','sun-o':'f185','moon-o':'f186','archive':'f187','bug':'f188','vk':'f189','weibo':'f18a','renren':'f18b','pagelines':'f18c','stack-exchange':'f18d','arrow-circle-o-right':'f18e','arrow-circle-o-left':'f190','toggle-left,caret-square-o-left':'f191','dot-circle-o':'f192','wheelchair':'f193','vimeo-square':'f194','turkish-lira,try':'f195','plus-square-o':'f196','space-shuttle':'f197','slack':'f198','envelope-square':'f199','wordpress':'f19a','openid':'f19b','institution,bank,university':'f19c','mortar-board,graduation-cap':'f19d','yahoo':'f19e','google':'f1a0','reddit':'f1a1','reddit-square':'f1a2','stumbleupon-circle':'f1a3','stumbleupon':'f1a4','delicious':'f1a5','digg':'f1a6','pied-piper-pp':'f1a7','pied-piper-alt':'f1a8','drupal':'f1a9','joomla':'f1aa','language':'f1ab','fax':'f1ac','building':'f1ad','child':'f1ae','paw':'f1b0','spoon':'f1b1','cube':'f1b2','cubes':'f1b3','behance':'f1b4','behance-square':'f1b5','steam':'f1b6','steam-square':'f1b7','recycle':'f1b8','automobile,car':'f1b9','cab,taxi':'f1ba','tree':'f1bb','spotify':'f1bc','deviantart':'f1bd','soundcloud':'f1be','database':'f1c0','file-pdf-o':'f1c1','file-word-o':'f1c2','file-excel-o':'f1c3','file-powerpoint-o':'f1c4','file-photo-o,file-picture-o,file-image-o':'f1c5','file-zip-o,file-archive-o':'f1c6','file-sound-o,file-audio-o':'f1c7','file-movie-o,file-video-o':'f1c8','file-code-o':'f1c9','vine':'f1ca','codepen':'f1cb','jsfiddle':'f1cc','life-bouy,life-buoy,life-saver,support,life-ring':'f1cd','circle-o-notch':'f1ce','ra,resistance,rebel':'f1d0','ge,empire':'f1d1','git-square':'f1d2','git':'f1d3','y-combinator-square,yc-square,hacker-news':'f1d4','tencent-weibo':'f1d5','qq':'f1d6','wechat,weixin':'f1d7','send,paper-plane':'f1d8','send-o,paper-plane-o':'f1d9','history':'f1da','circle-thin':'f1db','header':'f1dc','paragraph':'f1dd','sliders':'f1de','share-alt':'f1e0','share-alt-square':'f1e1','bomb':'f1e2','soccer-ball-o,futbol-o':'f1e3','tty':'f1e4','binoculars':'f1e5','plug':'f1e6','slideshare':'f1e7','twitch':'f1e8','yelp':'f1e9','newspaper-o':'f1ea','wifi':'f1eb','calculator':'f1ec','paypal':'f1ed','google-wallet':'f1ee','cc-visa':'f1f0','cc-mastercard':'f1f1','cc-discover':'f1f2','cc-amex':'f1f3','cc-paypal':'f1f4','cc-stripe':'f1f5','bell-slash':'f1f6','bell-slash-o':'f1f7','trash':'f1f8','copyright':'f1f9','at':'f1fa','eyedropper':'f1fb','paint-brush':'f1fc','birthday-cake':'f1fd','area-chart':'f1fe','pie-chart':'f200','line-chart':'f201','lastfm':'f202','lastfm-square':'f203','toggle-off':'f204','toggle-on':'f205','bicycle':'f206','bus':'f207','ioxhost':'f208','angellist':'f209','cc':'f20a','shekel,sheqel,ils':'f20b','meanpath':'f20c','buysellads':'f20d','connectdevelop':'f20e','dashcube':'f210','forumbee':'f211','leanpub':'f212','sellsy':'f213','shirtsinbulk':'f214','simplybuilt':'f215','skyatlas':'f216','cart-plus':'f217','cart-arrow-down':'f218','diamond':'f219','ship':'f21a','user-secret':'f21b','motorcycle':'f21c','street-view':'f21d','heartbeat':'f21e','venus':'f221','mars':'f222','mercury':'f223','intersex,transgender':'f224','transgender-alt':'f225','venus-double':'f226','mars-double':'f227','venus-mars':'f228','mars-stroke':'f229','mars-stroke-v':'f22a','mars-stroke-h':'f22b','neuter':'f22c','genderless':'f22d','facebook-official':'f230','pinterest-p':'f231','whatsapp':'f232','server':'f233','user-plus':'f234','user-times':'f235','hotel,bed':'f236','viacoin':'f237','train':'f238','subway':'f239','medium':'f23a','yc,y-combinator':'f23b','optin-monster':'f23c','opencart':'f23d','expeditedssl':'f23e','battery-4,battery-full':'f240','battery-3,battery-three-quarters':'f241','battery-2,battery-half':'f242','battery-1,battery-quarter':'f243','battery-0,battery-empty':'f244','mouse-pointer':'f245','i-cursor':'f246','object-group':'f247','object-ungroup':'f248','sticky-note':'f249','sticky-note-o':'f24a','cc-jcb':'f24b','cc-diners-club':'f24c','clone':'f24d','balance-scale':'f24e','hourglass-o':'f250','hourglass-1,hourglass-start':'f251','hourglass-2,hourglass-half':'f252','hourglass-3,hourglass-end':'f253','hourglass':'f254','hand-grab-o,hand-rock-o':'f255','hand-stop-o,hand-paper-o':'f256','hand-scissors-o':'f257','hand-lizard-o':'f258','hand-spock-o':'f259','hand-pointer-o':'f25a','hand-peace-o':'f25b','trademark':'f25c','registered':'f25d','creative-commons':'f25e','gg':'f260','gg-circle':'f261','tripadvisor':'f262','odnoklassniki':'f263','odnoklassniki-square':'f264','get-pocket':'f265','wikipedia-w':'f266','safari':'f267','chrome':'f268','firefox':'f269','opera':'f26a','internet-explorer':'f26b','tv,television':'f26c','contao':'f26d','500px':'f26e','amazon':'f270','calendar-plus-o':'f271','calendar-minus-o':'f272','calendar-times-o':'f273','calendar-check-o':'f274','industry':'f275','map-pin':'f276','map-signs':'f277','map-o':'f278','map':'f279','commenting':'f27a','commenting-o':'f27b','houzz':'f27c','vimeo':'f27d','black-tie':'f27e','fonticons':'f280','reddit-alien':'f281','edge':'f282','credit-card-alt':'f283','codiepie':'f284','modx':'f285','fort-awesome':'f286','usb':'f287','product-hunt':'f288','mixcloud':'f289','scribd':'f28a','pause-circle':'f28b','pause-circle-o':'f28c','stop-circle':'f28d','stop-circle-o':'f28e','shopping-bag':'f290','shopping-basket':'f291','hashtag':'f292','bluetooth':'f293','bluetooth-b':'f294','percent':'f295','gitlab':'f296','wpbeginner':'f297','wpforms':'f298','envira':'f299','universal-access':'f29a','wheelchair-alt':'f29b','question-circle-o':'f29c','blind':'f29d','audio-description':'f29e','volume-control-phone':'f2a0','braille':'f2a1','assistive-listening-systems':'f2a2','asl-interpreting,american-sign-language-interpreting':'f2a3','deafness,hard-of-hearing,deaf':'f2a4','glide':'f2a5','glide-g':'f2a6','signing,sign-language':'f2a7','low-vision':'f2a8','viadeo':'f2a9','viadeo-square':'f2aa','snapchat':'f2ab','snapchat-ghost':'f2ac','snapchat-square':'f2ad','pied-piper':'f2ae','first-order':'f2b0','yoast':'f2b1','themeisle':'f2b2','google-plus-circle,google-plus-official':'f2b3','fa,font-awesome':'f2b4'};
    }

    function image(d) {
        var i, imagesForLabel, img, imgLevel, label, labelPropertyValue, property, value;

        if (options.images) {
            imagesForLabel = options.imageMap[d.labels[0]];

            if (imagesForLabel) {
                imgLevel = 0;

                for (i = 0; i < imagesForLabel.length; i++) {
                    labelPropertyValue = imagesForLabel[i].split('|');

                    switch (labelPropertyValue.length) {
                        case 3:
                            value = labelPropertyValue[2];
                        /* falls through */
                        case 2:
                            property = labelPropertyValue[1];
                        /* falls through */
                        case 1:
                            label = labelPropertyValue[0];
                    }

                    if (d.labels[0] === label &&
                        (!property || d.properties[property] !== undefined) &&
                        (!value || d.properties[property] === value)) {
                        if (labelPropertyValue.length > imgLevel) {
                            img = options.images[imagesForLabel[i]];
                            imgLevel = labelPropertyValue.length;
                        }
                    }
                }
            }
        }

        return img;
    }


    function init(_selector, _options) {
        merge(options, _options);

        if (!options.minCollision) {
            options.minCollision = options.nodeRadius * 2;
        }

        initImageMap();

        selector = _selector;

        container = d3.select(selector);

        container.attr('class', 'neo4jd3')
            .html('');

        if (options.infoPanel) {
            if (options.infoSelector) {
                console.log("----use options.infoSelector---");
                console.log(options.infoSelector);
                info = d3.select(options.infoPanelSelector);
                info.attr('class', 'neo4jd3-info')
                    .html('');
            } else
                info = appendInfoPanel(container);
        }

        appendGraph(container);

        simulation = initSimulation();
        nodes = [];
        relationships = [];

        if (options.D3Data) {
            updateWithD3Data(options.D3Data);
        } else {
            console.error('initial D3Data from config is empty!');
        }
    }

    function initImageMap() {
        var key, keys, selector;

        for (key in options.images) {
            if (options.images.hasOwnProperty(key)) {
                keys = key.split('|');

                if (!options.imageMap[keys[0]]) {
                    options.imageMap[keys[0]] = [key];
                } else {
                    options.imageMap[keys[0]].push(key);
                }
            }
        }
    }

    function initSimulation() {
        let simulation = d3.forceSimulation()
                                  // .velocityDecay(0.8)
                                  // .force('x', d3.force().strength(0.002))
                                  // .force('y', d3.force().strength(0.002))
            .force('collide', d3.forceCollide().radius(function (d) {
                return options.minCollision;
            }).iterations(0.5))
            .force('charge', d3.forceManyBody())
            // .force('charge', function (d) {
            //     var charge = -500;
            //     if (d.index === 0) charge = 10 * charge;
            //     return charge;
            // })
            .force('link', d3.forceLink().id(function (d) {
                return d.id;
            }))
            // .force('center', d3.forceCenter(svg.node().parentElement.parentElement.clientWidth / 2, svg.node().parentElement.parentElement.clientHeight / 2))
            .on('tick', function () {
                tick();
            })
            .on('end', function () {
                if (options.zoomFit && !justLoaded) {
                    justLoaded = true;
                    zoomFit(2);
                }
            });

        return simulation;
    }


    function merge(target, source) {
        Object.keys(source).forEach(function (property) {
            target[property] = source[property];
        });
    }

    function neo4jDataToD3Data(data) {
        let graph = {
            nodes: [],
            relationships: []
        };

        data.results.forEach(function (result) {
            result.data.forEach(function (data) {
                data.graph.nodes.forEach(function (node) {
                    if (!contains(graph.nodes, node.id)) {
                        graph.nodes.push(node);
                    }
                });

                data.graph.relationships.forEach(function (relationship) {
                    relationship.source = relationship.startNode;
                    relationship.target = relationship.endNode;
                    graph.relationships.push(relationship);
                });

                data.graph.relationships.sort(function (a, b) {
                    if (a.source > b.source) {
                        return 1;
                    } else if (a.source < b.source) {
                        return -1;
                    } else {
                        if (a.target > b.target) {
                            return 1;
                        }

                        if (a.target < b.target) {
                            return -1;
                        } else {
                            return 0;
                        }
                    }
                });

                for (let i = 0; i < data.graph.relationships.length; i++) {
                    if (i !== 0 && data.graph.relationships[i].source === data.graph.relationships[i - 1].source && data.graph.relationships[i].target === data.graph.relationships[i - 1].target) {
                        data.graph.relationships[i].linknum = data.graph.relationships[i - 1].linknum + 1;
                    } else {
                        data.graph.relationships[i].linknum = 1;
                    }
                }
            });
        });

        return graph;
    }


    function rotate(cx, cy, x, y, angle) {
        let radians = (Math.PI / 180) * angle,
            cos = Math.cos(radians),
            sin = Math.sin(radians),
            nx = (cos * (x - cx)) + (sin * (y - cy)) + cx,
            ny = (cos * (y - cy)) - (sin * (x - cx)) + cy;

        return {x: nx, y: ny};
    }

    function rotatePoint(c, p, angle) {
        return rotate(c.x, c.y, p.x, p.y, angle);
    }

    function rotation(source, target) {
        return Math.atan2(target.y - source.y, target.x - source.x) * 180 / Math.PI;
    }

    function size() {
        return {
            nodes: nodes.length,
            relationships: relationships.length
        };
    }

    /*
        function smoothTransform(elem, translate, scale) {
            var animationMilliseconds = 5000,
                timeoutMilliseconds = 50,
                steps = parseInt(animationMilliseconds / timeoutMilliseconds);
            setTimeout(function() {
                smoothTransformStep(elem, translate, scale, timeoutMilliseconds, 1, steps);
            }, timeoutMilliseconds);
        }
        function smoothTransformStep(elem, translate, scale, timeoutMilliseconds, step, steps) {
            var progress = step / steps;
            elem.attr('transform', 'translate(' + (translate[0] * progress) + ', ' + (translate[1] * progress) + ') scale(' + (scale * progress) + ')');
            if (step < steps) {
                setTimeout(function() {
                    smoothTransformStep(elem, translate, scale, timeoutMilliseconds, step + 1, steps);
                }, timeoutMilliseconds);
            }
        }
    */
    function stickNode(d) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
    }

    function tick() {
        tickNodes();
        tickRelationships();




    }

    function tickNodes() {
        if (node) {
            node.attr('transform', function (d) {
                return 'translate(' + d.x + ', ' + d.y + ')';
            });
        }
    }

    function tickRelationships() {
        if (relationship) {

            relationship
                .attr('transform', function (d) {
                    // console.log(d);
                let angle = rotation(d.source, d.target);
                return 'translate(' + d.source.x + ', ' + d.source.y + ') rotate(' + angle + ')';
            });
            tickRelationshipsTexts();
            tickRelationshipsOutlines();
            tickRelationshipsOverlays();
        }
    }

    function tickRelationshipsOutlines() {
        relationship.each(function (relationship) {
            let rel = d3.select(this),
                outline = rel.select('.outline'),
                text = rel.select('.text'),
                bbox = text.node().getBBox(),
                padding = 3;


            outline.attr('d', function (d) {





                let     center = {x: 0, y: 0},
                    angle = rotation(d.source, d.target),
                    textBoundingBox = text.node().getBBox(),
                    textPadding = 5,
                    u = unitaryVector(d.source, d.target),
                    textMargin = {
                        x: (d.target.x - d.source.x - (textBoundingBox.width + textPadding) * u.x) * 0.5,
                        y: (d.target.y - d.source.y - (textBoundingBox.width + textPadding) * u.y) * 0.5
                    },
                    n = unitaryNormalVector(d.source, d.target),
                    rotatedPointA1 = rotatePoint(center, {
                        x: 0 + (options.nodeRadius + 1) * u.x - n.x,
                        y: 0 + (options.nodeRadius + 1) * u.y - n.y
                    }, angle),
                    rotatedPointB1 = rotatePoint(center, {x: textMargin.x - n.x, y: textMargin.y - n.y}, angle),
                    rotatedPointC1 = rotatePoint(center, {x: textMargin.x, y: textMargin.y}, angle),
                    rotatedPointD1 = rotatePoint(center, {
                        x: 0 + (options.nodeRadius + 1) * u.x,
                        y: 0 + (options.nodeRadius + 1) * u.y
                    }, angle),
                    rotatedPointA2 = rotatePoint(center, {
                        x: d.target.x - d.source.x - textMargin.x - n.x,
                        y: d.target.y - d.source.y - textMargin.y - n.y
                    }, angle),
                    rotatedPointB2 = rotatePoint(center, {
                        x: d.target.x - d.source.x - (options.nodeRadius + 1) * u.x - n.x - u.x * options.arrowSize,
                        y: d.target.y - d.source.y - (options.nodeRadius + 1) * u.y - n.y - u.y * options.arrowSize
                    }, angle),
                    rotatedPointC2 = rotatePoint(center, {
                        x: d.target.x - d.source.x - (options.nodeRadius + 1) * u.x - n.x + (n.x - u.x) * options.arrowSize,
                        y: d.target.y - d.source.y - (options.nodeRadius + 1) * u.y - n.y + (n.y - u.y) * options.arrowSize
                    }, angle),
                    rotatedPointD2 = rotatePoint(center, {
                        x: d.target.x - d.source.x - (options.nodeRadius + 1) * u.x,
                        y: d.target.y - d.source.y - (options.nodeRadius + 1) * u.y
                    }, angle),
                    rotatedPointE2 = rotatePoint(center, {
                        x: d.target.x - d.source.x - (options.nodeRadius + 1) * u.x + (-n.x - u.x) * options.arrowSize,
                        y: d.target.y - d.source.y - (options.nodeRadius + 1) * u.y + (-n.y - u.y) * options.arrowSize
                    }, angle),
                    rotatedPointF2 = rotatePoint(center, {
                        x: d.target.x - d.source.x - (options.nodeRadius + 1) * u.x - u.x * options.arrowSize,
                        y: d.target.y - d.source.y - (options.nodeRadius + 1) * u.y - u.y * options.arrowSize
                    }, angle),
                    rotatedPointG2 = rotatePoint(center, {
                        x: d.target.x - d.source.x - textMargin.x,
                        y: d.target.y - d.source.y - textMargin.y
                    }, angle);

                // return 'M ' + rotatedPointA1.x + ' ' + rotatedPointA1.y +
                //     ' L ' + rotatedPointB1.x + ' ' + rotatedPointB1.y +
                //     ' L ' + rotatedPointC1.x + ' ' + rotatedPointC1.y +
                //     ' L ' + rotatedPointD1.x + ' ' + rotatedPointD1.y +
                //     'A' + dr + "," + dr + " 0 0,1 " + rotatedPointA1.x + "," + rotatedPointA1.y +
                //     'A' + dr + "," + dr + " 0 0,1 " + rotatedPointB1.x + "," + rotatedPointB1.y +
                //     'A' + dr + "," + dr + " 0 0,1 " + rotatedPointC1.x + "," + rotatedPointC1.y +
                //     'A' + dr + "," + dr + " 0 0,1 " + rotatedPointD1.x + "," + rotatedPointD1.y +
                //     ' Z M ' + rotatedPointA2.x + ' ' + rotatedPointA2.y +
                //     ' L ' + rotatedPointB2.x + ' ' + rotatedPointB2.y +
                //     ' L ' + rotatedPointC2.x + ' ' + rotatedPointC2.y +
                //     ' L ' + rotatedPointD2.x + ' ' + rotatedPointD2.y +
                //     ' L ' + rotatedPointE2.x + ' ' + rotatedPointE2.y +
                //     ' L ' + rotatedPointF2.x + ' ' + rotatedPointF2.y +
                //     ' L ' + rotatedPointG2.x + ' ' + rotatedPointG2.y +
                //     'A' + dr + "," + dr + " 0 0,1 " + rotatedPointA2.x + "," + rotatedPointA2.y +
                //     'A' + dr + "," + dr + " 0 0,1 " + rotatedPointB2.x + "," + rotatedPointB2.y +
                //     'A' + dr + "," + dr + " 0 0,1 " + rotatedPointC2.x + "," + rotatedPointC2.y +
                //     'A' + dr + "," + dr + " 0 0,1 " + rotatedPointD2.x + "," + rotatedPointD2.y +
                //     'A' + dr + "," + dr + " 0 0,1 " + rotatedPointE2.x + "," + rotatedPointE2.y +
                //     'A' + dr + "," + dr + " 0 0,1 " + rotatedPointF2.x + "," + rotatedPointF2.y +
                //     'A' + dr + "," + dr + " 0 0,1 " + rotatedPointG2.x + "," + rotatedPointG2.y +
                //     ' Z';



                if(d.target===d.source){
                    // dr = 30/d.linknum;
                    // return"M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 1,1 " + d.target.x + "," + (d.target.y+1);
                }else if(d.size%2!=0 && d.linknum===1){//如果两个节点之间的连接线数量为奇数条，则设置编号为1的连接线为直线，其他连接线会均分在两边
                    return 'M ' + rotatedPointA1.x + ' ' + rotatedPointA1.y +
                        ' L ' + rotatedPointB1.x + ' ' + rotatedPointB1.y +
                        ' L ' + rotatedPointC1.x + ' ' + rotatedPointC1.y +
                        ' L ' + rotatedPointD1.x + ' ' + rotatedPointD1.y +
                        ' Z M ' + rotatedPointA2.x + ' ' + rotatedPointA2.y +
                        ' L ' + rotatedPointB2.x + ' ' + rotatedPointB2.y +
                        ' L ' + rotatedPointC2.x + ' ' + rotatedPointC2.y +   //shang ban jian tou
                        ' L ' + rotatedPointD2.x + ' ' + rotatedPointD2.y +   //jian tou
                        ' L ' + rotatedPointE2.x + ' ' + rotatedPointE2.y +   //xia ban jian tou
                        ' L ' + rotatedPointF2.x + ' ' + rotatedPointF2.y +
                        ' L ' + rotatedPointG2.x + ' ' + rotatedPointG2.y +
                        ' Z';

                }
                // dr = Math.sqrt(dx*dx+dy*dy)*(d.linknum+1.2)/(1.5*1.2);
                var dx1 = rotatedPointB2.x - rotatedPointA1.x,
                    dy1 = rotatedPointB2.y - rotatedPointA1.y,
                    dr1 = Math.sqrt(dx1*dx1+dy1*dy1)*(d.linknum+1.2)/(1.5*1.2);
                var dx2 = rotatedPointD1.x - rotatedPointF2.x,
                    dy2 = rotatedPointD1.y - rotatedPointF2.y,
                    dr2 = (Math.sqrt(dx2*dx2+dy2*dy2)*(d.linknum+1.2)/(1.5*1.2));
                // console.log(dr1+" "+dr2)
                // console.log(dr1+"  "+dr2)

                return 'M ' + rotatedPointA1.x + ' ' + rotatedPointA1.y +
                    ' L ' + rotatedPointB1.x + ' ' + rotatedPointB1.y +
                    ' L ' + rotatedPointC1.x + ' ' + rotatedPointC1.y +
                    ' L ' + rotatedPointD1.x + ' ' + rotatedPointD1.y +
                    ' Z M ' + rotatedPointA2.x + ' ' + rotatedPointA2.y +
                    ' L ' + rotatedPointB2.x + ' ' + rotatedPointB2.y +
                    ' L ' + rotatedPointC2.x + ' ' + rotatedPointC2.y +   //shang ban jian tou
                    ' L ' + rotatedPointD2.x + ' ' + rotatedPointD2.y +   //jian tou
                    ' L ' + rotatedPointE2.x + ' ' + rotatedPointE2.y +   //xia ban jian tou
                    ' L ' + rotatedPointF2.x + ' ' + rotatedPointF2.y +
                    ' L ' + rotatedPointG2.x + ' ' + rotatedPointG2.y +
                    ' Z';
                //this is hudu
                // return 'M ' + rotatedPointA1.x + ' ' + rotatedPointA1.y +
                //     " A " + dr1 + "," + dr1 + " 0 0 1 " + rotatedPointB2.x + "," + (rotatedPointB2.y-10) +
                //     ' L ' + rotatedPointC2.x + (rotatedPointC2.y-10) +
                //     ' L ' + (rotatedPointD2.x+2) + ' ' + (rotatedPointD2.y-8) +
                //     ' L ' + rotatedPointE2.x + ' ' + (rotatedPointE2.y-10) +
                //     ' L ' + rotatedPointF2.x + ' ' + (rotatedPointF2.y-10) +
                //     " A " + dr1 + "," + dr1 + " 1 0 0 " + rotatedPointD1.x + "," + rotatedPointD1.y +

                    // // ' L ' + rotatedPointB1.x + ' ' + rotatedPointB1.y +
                    // ' L ' + rotatedPointC1.x + ' ' + rotatedPointC1.y +
                    // " A " + dr2 + "," + dr2 + " 1 0 0 " + rotatedPointD1.x + "," + rotatedPointD1.y +
                    // // ' L ' + rotatedPointD1.x + ' ' + rotatedPointD1.y +
                    // // 'A' + dr + "," + dr + " 0 0,1 " + rotatedPointA1.x + "," + rotatedPointA1.y +
                    // // 'A' + dr + "," + dr + " 0 0,1 " + rotatedPointB1.x + "," + rotatedPointB1.y +
                    // // 'A' + dr + "," + dr + " 0 0,1 " + rotatedPointC1.x + "," + rotatedPointC1.y +
                    // // 'A' + dr + "," + dr + " 0 0,1 " + rotatedPointD1.x + "," + rotatedPointD1.y +
                    // ' Z M ' + rotatedPointA2.x + ' ' + rotatedPointA2.y +
                    // ' L ' + rotatedPointB2.x + ' ' + rotatedPointB2.y +
                    // ' L ' + rotatedPointC2.x + ' ' + rotatedPointC2.y +
                    // ' L ' + rotatedPointD2.x + ' ' + rotatedPointD2.y +
                    // ' L ' + rotatedPointE2.x + ' ' + rotatedPointE2.y +
                    // ' L ' + rotatedPointF2.x + ' ' + rotatedPointF2.y +
                    // ' L ' + rotatedPointG2.x + ' ' + rotatedPointG2.y +
                    // // 'A' + dr + "," + dr + " 0 0,1 " + rotatedPointA2.x + "," + rotatedPointA2.y +
                    // // 'A' + dr + "," + dr + " 0 0,1 " + rotatedPointB2.x + "," + rotatedPointB2.y +
                    // // 'A' + dr + "," + dr + " 0 0,1 " + rotatedPointC2.x + "," + rotatedPointC2.y +
                    // // 'A' + dr + "," + dr + " 0 0,1 " + rotatedPointD2.x + "," + rotatedPointD2.y +
                    // // 'A' + dr + "," + dr + " 0 0,1 " + rotatedPointE2.x + "," + rotatedPointE2.y +
                    // // 'A' + dr + "," + dr + " 0 0,1 " + rotatedPointF2.x + "," + rotatedPointF2.y +
                    // // 'A' + dr + "," + dr + " 0 0,1 " + rotatedPointG2.x + "," + rotatedPointG2.y +
                    // ' Z';



            });
        });
    }

    function tickRelationshipsOverlays() {
        relationshipOverlay.attr('d', function (d) {
            let center = {x: 0, y: 0},
                angle = rotation(d.source, d.target),
                n1 = unitaryNormalVector(d.source, d.target),
                n = unitaryNormalVector(d.source, d.target, 50),
                rotatedPointA = rotatePoint(center, {x: 0 - n.x, y: 0 - n.y}, angle),
                rotatedPointB = rotatePoint(center, {
                    x: d.target.x - d.source.x - n.x,
                    y: d.target.y - d.source.y - n.y
                }, angle),
                rotatedPointC = rotatePoint(center, {
                    x: d.target.x - d.source.x + n.x - n1.x,
                    y: d.target.y - d.source.y + n.y - n1.y
                }, angle),
                rotatedPointD = rotatePoint(center, {x: 0 + n.x - n1.x, y: 0 + n.y - n1.y}, angle);

            return 'M ' + rotatedPointA.x + ' ' + rotatedPointA.y +
                ' L ' + rotatedPointB.x + ' ' + rotatedPointB.y +
                ' L ' + rotatedPointC.x + ' ' + rotatedPointC.y +
                ' L ' + rotatedPointD.x + ' ' + rotatedPointD.y +
                ' Z';
        });
    }

    function tickRelationshipsTexts() {
        relationshipText.attr('transform', function (d) {
            let angle = rotation(d.source, d.target),
                angle2 = (rotation(d.source, d.target) + 360) % 360,
                mirror = angle2 > 90 && angle2 < 270,
                center = {x: 0, y: 0},
                n = unitaryNormalVector(d.source, d.target),
                nWeight = mirror ? 2 : -3,
                point = {
                    x: (d.target.x - d.source.x) * 0.5 + n.x * nWeight,
                    y: (d.target.y - d.source.y) * 0.5 + n.y * nWeight
                },
                rotatedPoint = rotatePoint(center, point, angle);
                // textBoundingBox = text.node().getBBox(),
                // textPadding = 5,
                // u = unitaryVector(d.source, d.target),
                // textMargin = {
                //     x: (d.target.x - d.source.x - (textBoundingBox.width + textPadding) * u.x) * 0.5,
                //     y: (d.target.y - d.source.y - (textBoundingBox.width + textPadding) * u.y) * 0.5
                // },
                // rotatedPointA1 = rotatePoint(center, {
                //     x: 0 + (options.nodeRadius + 1) * u.x - n.x,
                //     y: 0 + (options.nodeRadius + 1) * u.y - n.y
                // }, angle),
                // rotatedPointB1 = rotatePoint(center, {x: textMargin.x - n.x, y: textMargin.y - n.y}, angle),
                // rotatedPointC1 = rotatePoint(center, {x: textMargin.x, y: textMargin.y}, angle),
                // rotatedPointD1 = rotatePoint(center, {
                //     x: 0 + (options.nodeRadius + 1) * u.x,
                //     y: 0 + (options.nodeRadius + 1) * u.y
                // }, angle),
                // rotatedPointA2 = rotatePoint(center, {
                //     x: d.target.x - d.source.x - textMargin.x - n.x,
                //     y: d.target.y - d.source.y - textMargin.y - n.y
                // }, angle),
                // rotatedPointB2 = rotatePoint(center, {
                //     x: d.target.x - d.source.x - (options.nodeRadius + 1) * u.x - n.x - u.x * options.arrowSize,
                //     y: d.target.y - d.source.y - (options.nodeRadius + 1) * u.y - n.y - u.y * options.arrowSize
                // }, angle),
                // rotatedPointC2 = rotatePoint(center, {
                //     x: d.target.x - d.source.x - (options.nodeRadius + 1) * u.x - n.x + (n.x - u.x) * options.arrowSize,
                //     y: d.target.y - d.source.y - (options.nodeRadius + 1) * u.y - n.y + (n.y - u.y) * options.arrowSize
                // }, angle),
                // rotatedPointD2 = rotatePoint(center, {
                //     x: d.target.x - d.source.x - (options.nodeRadius + 1) * u.x,
                //     y: d.target.y - d.source.y - (options.nodeRadius + 1) * u.y
                // }, angle),
                // rotatedPointE2 = rotatePoint(center, {
                //     x: d.target.x - d.source.x - (options.nodeRadius + 1) * u.x + (-n.x - u.x) * options.arrowSize,
                //     y: d.target.y - d.source.y - (options.nodeRadius + 1) * u.y + (-n.y - u.y) * options.arrowSize
                // }, angle),
                // rotatedPointF2 = rotatePoint(center, {
                //     x: d.target.x - d.source.x - (options.nodeRadius + 1) * u.x - u.x * options.arrowSize,
                //     y: d.target.y - d.source.y - (options.nodeRadius + 1) * u.y - u.y * options.arrowSize
                // }, angle),
                // rotatedPointG2 = rotatePoint(center, {
                //     x: d.target.x - d.source.x - textMargin.x,
                //     y: d.target.y - d.source.y - textMargin.y
                // }, angle);

            return 'translate(' + rotatedPoint.x + ', ' + rotatedPoint.y + ') rotate(' + (mirror ? 180 : 0) + ')';
        });
    }

    function toString(d) {
        let s = d.labels ? d.labels[0] : d.type;

        s += '\n\n';

        Object.keys(d.properties).forEach(function (property) {
            if(property.toLowerCase() === "description"){
                s += 'Description: ' + JSON.stringify(d.properties[property]).replace(/"/g, "");
            }
        });

        return s;
    }

    function unitaryNormalVector(source, target, newLength) {
        let center = {x: 0, y: 0},
            vector = unitaryVector(source, target, newLength);

        return rotatePoint(center, vector, 90);
    }

    function unitaryVector(source, target, newLength) {
        let length = Math.sqrt(Math.pow(target.x - source.x, 2) + Math.pow(target.y - source.y, 2)) / Math.sqrt(newLength || 1);

        return {
            x: (target.x - source.x) / length,
            y: (target.y - source.y) / length,
        };
    }

    function updateWithD3Data(d3Data) {
        updateNodesAndRelationships(d3Data.nodes, d3Data.relationships);
    }

    /**
     * update the graph,normally call this method after some value node and relationship data been deleted after
     in graph data,by need to update the UI
     */
    function updateGraph() {
        updateNodes([]);

        updateRelationships([]);

        simulation.nodes(nodes);
        simulation.force('link').links(relationships);
        // simulation.on('tick', tick());
        simulation.alpha(0.1).restart();
    }

    function removeWithD3Data(d3Data) {

        //updateNodesAndRelationships(d3Data.nodes, d3Data.relationships);
    }

    function removeNodeByID(nodeID) {
        for (let i = 0; i < nodes.length; i++) {
            if (nodes[i].id == nodeID) {
                nodes.splice(i, 1);
                break;
            }
        }
    }

    function removeRelationshipByID(relationshipID) {
        for (let i = 0; i < relationships.length; i++) {
            if (relationships[i].id == nodeID) {
                relationships.splice(i, 1);
                break;
            }
        }
    }

    function removeRelationshipConnectToNodeByNodeID(nodeID) {
        let length = relationships.length;
        for (let i = 0; i < length;) {
            if (relationships[i].startNode == nodeID || relationships[i].endNode == nodeID) {
                relationships.splice(i, 1);
                length = relationships.length;
            } else {
                i++;
            }
        }
    }

    /**
     * remove the node and relation ,after that update the whole graph
     * @param nodeID the node need to remove
     */
    function removeNodeAndRelationshipsByNodeID(nodeID) {
        removeNodeByID(nodeID);
        removeRelationshipConnectToNodeByNodeID(nodeID);

        updateGraph();
    }

    function cleanGraph() {
        nodes = [];
        relationships = [];
        updateGraph();
    }

    function updateInfo(d) {
        clearInfo();
        console.log(d);
        if (d.labels) {
            appendInfoElementClass('class', d.labels[0]);
        } else {
            appendInfoElementRelationship('class', d.type);
        }

        appendInfoElementProperty('property', '&lt;id&gt;', d.id);

        Object.keys(d.majority_properties).forEach(function (property) {
            appendInfoElementProperty('property', property, JSON.stringify(d.majority_properties[property]));
        });
    }

    function fillLabelsForNode(n) {
        if (n.labels)
            return n;
        else
            n.labels = ["concept"];
        return n;
    }

    function fillLabelsForNodes(nodesArray) {
        let result = [];
        for (let node of nodesArray) {
            result.push(fillLabelsForNode(node));
        }
        return result;
    }

    function updateNodes(n) {
        n = fillLabelsForNodes(n);
        for (let new_node of n) {
            let exist = false;
            for (let exist_node of nodes) {
                if (new_node.id === exist_node.id) {
                    exist = true;
                }
            }
            if (exist === false) {
                nodes.push(new_node);
            }
        }

        //Array.prototype.push.apply(nodes, n);

        node = svgNodes.selectAll('.node')
            .data(nodes, function (d) {
                return d.id;
            });
        removeNodeFromGraph();
        let nodeEnter = appendNodeToGraph();
        node = nodeEnter.merge(node);
    }

    function removeNodeFromGraph() {
        let remove_data = node.exit().remove();
    }

    function removeRelationFromGraph() {
        let remove_data = relationship.exit().remove();
    }

    function updateNodesAndRelationships(n, r) {
        updateNodes(n);
        updateRelationships(r);


        simulation.nodes(nodes);
        simulation.force('link').links(relationships);
        // simulation.on('tick', tick());

    }

    //关系分组
    var linkGroup = {};
    //对连接线进行统计和分组，不区分连接线的方向，只要属于同两个实体，即认为是同一组
    var linkmap = {}
    function updateRelationships(r) {

        if(r)
        {
            for(var i=0; i<r.length; i++){
                var key = r[i].source<r[i].target?r[i].source+':'+r[i].target:r[i].target+':'+r[i].source;
                if(!linkmap.hasOwnProperty(key)){
                    linkmap[key] = 0;
                }
                linkmap[key]+=1;
                if(!linkGroup.hasOwnProperty(key)){
                    linkGroup[key]=[];
                }
                linkGroup[key].push(r[i]);
            }
            //为每一条连接线分配size属性，同时对每一组连接线进行编号
            for(var i=0; i<r.length; i++){
                var key = r[i].source<r[i].target?r[i].source+':'+r[i].target:r[i].target+':'+r[i].source;
                r[i].size = linkmap[key];
                //同一组的关系进行编号
                var group = linkGroup[key];
                var keyPair = key.split(':');
                var type = 'noself';//标示该组关系是指向两个不同实体还是同一个实体
                if(keyPair[0]==keyPair[1]){
                    type = 'self';
                }
                //给节点分配编号
                setLinkNumber(group,type);
            }

            function setLinkNumber(group,type){
                if(group.length==0) return;
                //对该分组内的关系按照方向进行分类，此处根据连接的实体ASCII值大小分成两部分
                var linksA = [], linksB = [];
                for(var i = 0;i<group.length;i++){
                    var link = group[i];
                    if(link.source < link.target){
                        linksA.push(link);
                    }else{
                        linksB.push(link);
                    }
                }
                //确定关系最大编号。为了使得连接两个实体的关系曲线呈现对称，根据关系数量奇偶性进行平分。
                //特殊情况：当关系都是连接到同一个实体时，不平分
                var maxLinkNumber = 0;
                if(type=='self'){
                    maxLinkNumber = group.length;
                }else{
                    maxLinkNumber = group.length%2==0?group.length/2:(group.length+1)/2;
                }
                //如果两个方向的关系数量一样多，直接分别设置编号即可
                if(linksA.length==linksB.length){
                    var startLinkNumber = 1;
                    for(var i=0;i<linksA.length;i++){
                        linksA[i].linknum = startLinkNumber++;
                    }
                    startLinkNumber = 1;
                    for(var i=0;i<linksB.length;i++){
                        linksB[i].linknum = startLinkNumber++;
                    }
                }else{//当两个方向的关系数量不对等时，先对数量少的那组关系从最大编号值进行逆序编号，然后在对另一组数量多的关系从编号1一直编号到最大编号，再对剩余关系进行负编号
                    //如果抛开负号，可以发现，最终所有关系的编号序列一定是对称的（对称是为了保证后续绘图时曲线的弯曲程度也是对称的）
                    var biggerLinks,smallerLinks;
                    if(linksA.length>linksB.length){
                        biggerLinks = linksA;
                        smallerLinks = linksB;
                    }else{
                        biggerLinks = linksB;
                        smallerLinks = linksA;
                    }

                    var startLinkNumber = maxLinkNumber;
                    for(var i=0;i<smallerLinks.length;i++){
                        smallerLinks[i].linknum = startLinkNumber--;
                    }
                    var tmpNumber = startLinkNumber;

                    startLinkNumber = 1;
                    var p = 0;
                    while(startLinkNumber<=maxLinkNumber){
                        biggerLinks[p++].linknum = startLinkNumber++;
                    }
                    //开始负编号
                    startLinkNumber = 0-tmpNumber;
                    for(var i=p;i<biggerLinks.length;i++){
                        biggerLinks[i].linknum = startLinkNumber++;
                    }
                }
            }
        }


        for (let new_relation of r) {
            let exist = false;
            for (let exist_relation of relationships) {
                if (new_relation.id === exist_relation.id) {
                    exist = true;
                }
            }
            if (exist === false) {
                relationships.push(new_relation);
            }
        }

        relationship = svgRelationships.selectAll('.relationship')
            .data(relationships, function (d) {
                return d.id;
            });
        removeRelationFromGraph();
        let relationshipEnter = appendRelationshipToGraph();

        relationship = relationshipEnter.relationship.merge(relationship);

        relationshipOutline = svg.selectAll('.relationship .outline');
        relationshipOutline = relationshipEnter.outline.merge(relationshipOutline);

        relationshipOverlay = svg.selectAll('.relationship .overlay');
        relationshipOverlay = relationshipEnter.overlay.merge(relationshipOverlay);

        relationshipText = svg.selectAll('.relationship .text');
        relationshipText = relationshipEnter.text.merge(relationshipText);

    }

    function version() {
        return VERSION;
    }

    function zoomFit(transitionDuration) {
        let bounds = svg.node().getBBox(),
            parent = svg.node().parentElement.parentElement,
            fullWidth = parent.clientWidth,
            fullHeight = parent.clientHeight,
            width = bounds.width,
            height = bounds.height,
            midX = bounds.x + width / 2,
            midY = bounds.y + height / 2;

        if (width === 0 || height === 0) {
            return; // nothing to fit
        }

        svgScale = 0.85 / Math.max(width / fullWidth, height / fullHeight);
        svgTranslate = [fullWidth / 2 - svgScale * midX, fullHeight / 2 - svgScale * midY];

        svg.attr('transform', 'translate(' + svgTranslate[0] + ', ' + svgTranslate[1] + ') scale(' + svgScale + ')');
//        smoothTransform(svgTranslate, svgScale);
    }

    init(_selector, _options);

    // function nodesData() {
    //     for(let i of nodes) console.log(i)
    // }
    function nodesColor() {
        let text="labels color:";
        $.each(nodescolor,function (i,val) {
            text+= "<div><div style='float: left'>" + i +":</div> <div style='background-color: "+ val +"; width: 2em;height: 2em;border-radius:50%; margin-left:75%;margin-top:5px'></div></div>"
        });
        $("#colortip").html(text);

        return nodescolor;
    }


    function svgMove(moveX, moveY){
        /*let bounds = svg.node().getBBox(),
            parent = svg.node().parentElement.parentElement,
            fullWidth = parent.clientWidth,
            fullHeight = parent.clientHeight,
            width = bounds.width,
            height = bounds.height,
            midX = bounds.x + width / 2,
            midY = bounds.y + height / 2;
        console.log(parent);
        console.log(svg.select('g'));
        console.log(svg.node());
        console.log(svg.node().attributes);
        console.log(svg.node().attributes["transform"]);
        console.log(width + " " + height + " " + fullWidth + " " + fullHeight);
        svg.node().attributes["transform"] = translate(moveX, moveY);*/
        svg.attr('transform', 'translate(' + moveX + ', ' + moveY + ')');
    }

    return {
        neo4jDataToD3Data: neo4jDataToD3Data,
        size: size,
        updateWithD3Data: updateWithD3Data,
        updateInfo: updateInfo,
        removeNodeAndRelationshipsByNodeID: removeNodeAndRelationshipsByNodeID,
        version: version,
        cleanGraph: cleanGraph,
        nodesColor: nodesColor,
        svgMove: svgMove,
    };
}
