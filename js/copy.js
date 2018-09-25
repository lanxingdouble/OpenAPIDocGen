let neo4jd3;
let startData = {
    "nodes": [],
    "relationships": []
};

let all_labels_color=["Software Concept", "Descriptive Knowledge", "API Concept", "API Package", "API Class", "API Interface", "API Field", "API Method", "API Parameter", "API Return Value","Exception"
];
neo4jd3 = new Neo4jD3('#GraphContainer', {
    D3Data: startData,
    zoomFit: false,
    infoPanel: true,
    onNodeDoubleClick: onNodeDoubleClick,
    icons: {
//                        'Address': 'home',
        'Api': 'gear',
//                        'BirthDate': 'birthday-cake',
        'Cookie': 'paw',
//                        'CreditCard': 'credit-card',
//                        'Device': 'laptop',
        'Email': 'at',
        'Git': 'git',
        'Github': 'github',
        'Google': 'google',
//                        'icons': 'font-awesome',
        'Ip': 'map-marker',
        'Issues': 'exclamation-circle',
        'Language': 'language',
        'Options': 'sliders',
        'Password': 'lock',
        'Phone': 'phone',
        'Project': 'folder-open',
        'SecurityChallengeAnswer': 'commenting',
        'User': 'user',
        'zoomFit': 'arrows-alt',
        'zoomIn': 'search-plus',
        'zoomOut': 'search-minus'
    },
    images: {
        'wikidata': 'img/twemoji/1f3e0.svg',
//                        'Api': 'img/twemoji/1f527.svg',
        'entity': 'img/twemoji/1f382.svg',
        'Cookie': 'img/twemoji/1f36a.svg',
        'CreditCard': 'img/twemoji/1f4b3.svg',
        'Device': 'img/twemoji/1f4bb.svg',
        'Email': 'img/twemoji/2709.svg',
        'Git': 'img/twemoji/1f5c3.svg',
        'Github': 'img/twemoji/1f5c4.svg',
        'icons': 'img/twemoji/1f38f.svg',
        'Ip': 'img/twemoji/1f4cd.svg',
        'Issues': 'img/twemoji/1f4a9.svg',
        'Language': 'img/twemoji/1f1f1-1f1f7.svg',
        'Options': 'img/twemoji/2699.svg',
        'Password': 'img/twemoji/1f511.svg',
//                        'Phone': 'img/twemoji/1f4de.svg',
        'Project': 'img/twemoji/2198.svg',
        'Project|name|neo4jd3': 'img/twemoji/2196.svg',
//                        'SecurityChallengeAnswer': 'img/twemoji/1f4ac.svg',
        'User': 'img/twemoji/1f600.svg'
//                        'zoomFit': 'img/twemoji/2194.svg',
//                        'zoomIn': 'img/twemoji/1f50d.svg',
//                        'zoomOut': 'img/twemoji/1f50e.svg'
    },
});
var class_releated_concept;
var class_kg_id;
var thisURL = document.URL;
var getval = thisURL.split('?')[1];
var first_kg_id = getval.split("=")[1];
var class_mode = 1;
var method_mode = 2;
var labelProperty = [];
var labelList=[];
var labelStatusList=[];
var relationStatusList=[];
var nodesAndRelations=[];
var relationList=[];
var labels_set;
var color_index = 0;
var method_sentence_flag=0;
$(document).ready(function () {
    if (first_kg_id > 0) {
        console.log("#class_description",$("#class_description").html);
        $(".details").show();
        $(".description").show();
        $("#accordion").show();
        $("#bt3").show();
        console.log(thisURL);
        console.log("loading:", first_kg_id);
        get_inheritance_tree(first_kg_id);
        get_class_description(first_kg_id);
        get_class_releated_api(first_kg_id);
        get_method_detail(first_kg_id);
        get_releated_post(first_kg_id, class_mode,0);
        get_example_code(first_kg_id, class_mode,0);
        get_functional_sentences(first_kg_id, class_mode, 0);
        get_directive_sentences(first_kg_id, class_mode, 0);
        get_expand_nodes(first_kg_id);
        console.log("first loading,auto");
    }
});

//see_also点击跳转
function get_class_kg_id_by_kg_id(kg_id) {
    var class_kg_id;
    $.ajax({
        async: true,
        url: "http://bigcode.fudan.edu.cn/dysd3/GetBelongToClassKGID/",
        type: "post",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify({"kg_id": kg_id}),
        error: function (xhr, status, errorThrown) {
            console.log("Error " + errorThrown);
            console.log("Status: " + status);
            console.log(xhr);
        },
        success: function (d) {
            class_kg_id = d.kg_id;
            console.log("get_class_kg_id_by_kg_id:", class_kg_id);
            if(class_kg_id>0) {
                window.open("?kg_id=" + class_kg_id);
            }
        }
    });
    return class_kg_id;
}

function get_inheritance_tree(kg_id) {
    $.ajax({
        async: true,
        url: "http://bigcode.fudan.edu.cn/dysd3/ExtendInfo/",
        type: "post",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify({"kg_id": kg_id}),
        error: function (xhr, status, errorThrown) {
            console.log("Error " + errorThrown);
            console.log("Status: " + status);
            console.log(xhr);
        },
        success: function (d) {
            console.log("inheritance:", d);
            br = "";
            for (var i = 0; i < d.length; i++) {
                l = "<ur>" + br + d[i].api_name + "</ur><br/>";
                br = br + "&nbsp&nbsp&nbsp&nbsp&nbsp";
                $("#inheritance").append(l);
            }
            $("#show_class_name").append("<h2>class "+d[d.length-1].api_name+"</h2>");
            $("#show_class_name").show();
        }
    });
}

function get_class_description(kg_id) {
    $.ajax({
        async: true,
        url: "http://bigcode.fudan.edu.cn/dysd3/GetAPIDescription/",
        type: "post",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify({"kg_id": kg_id}),
        error: function (xhr, status, errorThrown) {
            console.log("Error " + errorThrown);
            console.log("Status: " + status);
            console.log(xhr);
        },
        success: function (d) {
            console.log("class description:", d.description);
            //console.log("class_releated_concept:", class_releated_concept);
            if(d.description) {
                if(d.description.method_description_from_comment){
                    $("#class_see_also_script").tmpl(d).appendTo("#class_description");
                }else{
                    if(d.description.short_description){
                        $("#class_description").append("<dd>"+d.description.short_description+"</dd>");
                    }else{
                        if(d.description.poi_human_description){
                            $("#class_description").append("<dd>"+d.description.poi_human_description+"</dd>");
                        }else{
                            if(d.description.poi_rule_description){
                                $("#class_description").append("<dd>"+d.description.poi_rule_description+"</dd>");
                            }
                            else{
                                if(d.description.poi_deep_learning_description){
                                    $("#class_description").append("<dd>poi_deep_learning_description: "+d.description.poi_deep_learning_description+"</dd>");
                                }
                            }
                        }
                    }
                }
                $("#class_description").show();
            }
        }
    });
}

function get_class_releated_api(kg_id) {
    $.ajax({
        async: true,
        url: "http://bigcode.fudan.edu.cn/dysd3/RelatedAPISearch/",
        type: "post",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify({"kg_id": kg_id}),
        error: function (xhr, status, errorThrown) {
            console.log("Error " + errorThrown);
            console.log("Status: " + status);
            console.log(xhr);
        },
        success: function (d) {
            console.log("class see also:", d);
            if (d.length > 0) {
                console.log("start fill class see also:", d);
                for (var i = 0; i < d.length; i++) {
                    d[i]["simple_api_name"] = get_simple_name(d[i].api_name);
                }
                //$("#class_description").append("<br/><dt><span class=\"seeLabel\">See Also:</span></dt>");
                $("#class_see_also").append("<br/><dt><span class=\"seeLabel\">See Also:</span></dt>");
                $("#class_see_also_script").tmpl(d).appendTo("#class_see_also");
                console.log("class api releated:", d)
                $("#class_see_also").show();
            }
        }
    });
}

function get_method_detail(kg_id) {
    $.ajax({
        async: true,
        url: "http://bigcode.fudan.edu.cn/dysd3/MethodSearch/",
        type: "post",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify({"kg_id": kg_id}),
        error: function (xhr, status, errorThrown) {
            console.log("Error " + errorThrown);
            console.log("Status: " + status);
            console.log(xhr);
        },
        success: function (d) {
            console.log("method:", d);
            if (d.length) {
                for (var i = 0; i < d.length; i++) {
                    //see_also名字截取class+method
                    var see_also = d[i]["see_also"];
                    for (var j = 0; j < see_also.length; j++) {
                        see_also[j]["simple_api_name"] = get_simple_name(see_also[j]["api_name"]);
                    }
                    //处理返回值和声明
                    if (d[i].declaration==""){
                        d[i].declaration="public "+d[i].return_type+" "+get_simple_method_name(d[i]["method_name"]);
                    }else{
                        var declaration_split=d[i].declaration.split(" ");
                        d[i].return_type = declaration_split[0];
                    }
                    //将method_descriptions_json变成method_description
                    var method_description=[];
                    method_description.push( d[i]["method_descriptions_json"]);
                    d[i]["method_descriptions_list"]=method_description;
                }
                console.log("new methods:", d);
                $("#method_detail_script").tmpl(d).appendTo("#method_detail");
            }
        }
    });
}

function add_method_reledted_post(item, d) {
    if (d.length) {
        $(item).append("<dt><span class=\"seeLabel\">method releated discussion:</span></dt>");
        for (var i = 0; i < d.length; i++) {
            $(item).append("<ul class=\"blockList\"><li class=\"blockList\">");
            //$(item).append("<h4>" + "discussion" + (i + 1) + ": " + "</h4>");
            $(item).append("<div class=\"block\"><a target=\"_blank\" href=" + d[i].post_url + ">" + d[i].post_question);
            $(item).append("</a></div>");
            $(item).append("<h4>post type:</h4>");
            $(item).append("<dd>" + d[i].post_type + "</dd></ul>");
            $(item).append("<h4>summary:</h4>");
            $(item).append("<dd>" + d[i].post_summary + "</dd></ul>");
        }
    }
    // else {
    //     $(item).append("<dt><span class=\"seeLabel\">method releated discussion:</span></dt>");
    //     $(item).append("<dd>" + "null" + "</dd>");
    // }
}

function get_releated_post(kg_id, mode, item) {
    //mode=1 class ;mode=2 method
    $.ajax({
            async: true,
            url: "http://bigcode.fudan.edu.cn/dysd3/RelatedPostSearch/",
            type: "post",
            contentType: "application/json; charset=utf-8",
            data: JSON.stringify({"kg_id": kg_id}),
            error: function (xhr, status, errorThrown) {
                console.log("Error " + errorThrown);
                console.log("Status: " + status);
                console.log(xhr);
            },
            success: function (d) {
                console.log("post:", d);
                if (mode == 1) {
                    if (d.length > 0) {
                        $("#post_detail_script").tmpl(d).appendTo("#post_detail");
                    }
                } else {
                    add_method_reledted_post(item, d);
                }
            }
        }
    );
}

function add_method_example_code(item, d) {
    if (d.length) {
        $(item).append("<dt><span class=\"seeLabel\">method sample code:</span></dt>");
        for (var i = 0; i < d.length; i++) {
            $(item).append("<li class=\"blockList\" >");
            //$(item).append("<h4>" + "code" + (i + 1) + ": " + "</h4>");
            $(item).append("<ul class=\"blockList\"> <li class=\"blockLis\"><pre>" + d[i].code_text + "</pre>");
            if(d[i].code_summary) {
                $(item).append("<dt><span class=\"seeLabel\">code_summary:</span></dt>");
                $(item).append("<dd>" + d[i].code_summary + "</dd></li></ul></li>");
            }
        }
    }
    // else {
    //     $(item).append("<dt><span class=\"seeLabel\">method sample code:</span></dt>");
    //     $(item).append("<dd>" + "null" + "</dd>");
    // }
}

function get_example_code(kg_id, mode, item) {
    $.ajax({
            async: true,
            url: "http://bigcode.fudan.edu.cn/dysd3/ExampleCodeSearch/",
            type: "post",
            contentType: "application/json; charset=utf-8",
            data: JSON.stringify({"kg_id": kg_id}),
            error: function (xhr, status, errorThrown) {
                console.log("Error " + errorThrown);
                console.log("Status: " + status);
                console.log(xhr);
            },
            success: function (d) {
                console.log("sample code:", d);
                if (mode == 1) {
                    if (d.length) {
                        $("#code_description_script").tmpl(d).appendTo("#code_description");
                    }
                } else {
                    add_method_example_code(item, d);
                }
            }
        }
    );
}

function add_method_functional_sentence(item, d) {
    //$(item).append("<dt><span class=\"seeLabel\">method functional sentence:</span></dt>");
    if (d.length) {
        method_sentence_flag=1;
        $(item).append("<dt><span class=\"seeLabel\">method hints:</span></dt>");
        for (var i = 0; i < d.length; i++) {
            $(item).append("<dd><li><a target=\"_blank\" href="+d[i]["source_info"]["post_url"]+">" + d[i]["text"] + "</a></li></dd>");
        }
    }
    // else {
    //     $(item).append("<dt><span class=\"seeLabel\">method functional sentence:</span></dt>");
    //     $(item).append("<dd>" + "null" + "</dd>");
    // }
}

//获取functional_sentences
function get_functional_sentences(kg_id, mode, item) {
    $.ajax({
        async: true,
        url: "http://bigcode.fudan.edu.cn/dysd3/FunctionSentence/",
        type: "post",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify({"kg_id": kg_id}),
        error: function (xhr, status, errorThrown) {
            console.log("Error " + errorThrown);
            console.log("Status: " + status);
            console.log(xhr);
        },
        success: function (d) {
            console.log("functional_sentence:", d);
            if (mode == 1) {
                if (d.length) {
                    //$("#sentence_description").append("<br/><dt><span class=\"returnLabel\">Functional Sentences:</span></dt>");
                    $("#functional_sentence_description_script").tmpl(d).appendTo("#sentence_description");
                }
            } else {
                add_method_functional_sentence(item, d);
            }
        }
    });
}

function add_method_directive_sentence(item, d) {
    if (d.length) {
        //$(item).append("<dt><span class=\"seeLabel\">method directive sentence:</span></dt>");
        for (var i = 0; i < d.length; i++) {
            $(item).append("<dd><li><a target=\"_blank\" href="+d[i]["source_info"]["post_url"]+">" + d[i]["text"] + "</a></li></dd>");
        }
    }
    // else {
    //         $(item).append("<dt><span class=\"seeLabel\">method directive sentence:</span></dt>");
    //         $(item).append("<dd>" + "null" + "</dd>");
    // }
}

//获取directive sentences
function get_directive_sentences(kg_id, mode, item) {
    $.ajax({
        async: true,
        url: "http://bigcode.fudan.edu.cn/dysd3/DirectiveSentence/",
        type: "post",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify({"kg_id": kg_id}),
        error: function (xhr, status, errorThrown) {
            console.log("Error " + errorThrown);
            console.log("Status: " + status);
            console.log(xhr);
        },
        success: function (d) {
            console.log("directive_sentence:", d);

            if (mode == 1) {
                if (d.length) {
                    //$("#sentence_description").append("<br/><dt><span class=\"returnLabel\">Directive Sentences:</span></dt>");
                    $("#directive_sentence_description_script").tmpl(d).appendTo("#sentence_description");
                }
            } else {
                add_method_directive_sentence(item, d);
            }

        }
    });
}

function getLabelSet(labels) {
    if (labels) {
        for (let i = 0; i < labels.length; i++) {
            if ($.inArray(labels[i], labelList) === -1) {
                for (let j = 0; j < labelProperty.length; j++) {
                    if (labels[i] === labelProperty[j].name) {
                        let data = {
                            name: labels[i],
                            color: labelProperty[j].color
                        };
                        $("#labelTemplate").tmpl(data).appendTo("#labelList");
                        labelList.push(labels[i]);
                    }
                }

            }
        }
    }

}


//获取扩展节点
function get_expand_nodes(kg_id) {
    $.ajax({
        async: true,
        url: "http://bigcode.fudan.edu.cn/dysd3/expandNode/",
        type: "post",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify({"id": kg_id}),
        error: function (xhr, status, errorThrown) {
            console.log("Error " + errorThrown);
            console.log("Status: " + status);
            console.log(xhr);
        },
        success: function (d) {
            if (d === "fail") {
                return
            }
            var labels = []
            $.each(d.nodes, function (i, val) {
                labels.push(d.nodes[i]["labels"][0]);
            });
            //console.log("labels:", labels);
            labels_set = new Set(labels);
            //console.log("labels_set", labels_set);
            for (var value of labels_set) {
                var color_label = {};
                color_index=all_labels_color.indexOf(value);
                //console.log("color index : ",color_index);
                color_label["color"] = generateRandomColor(color_index);
                color_label["name"] = value;
                //console.log("color_label", color_label);
                labelProperty.push(color_label);
                // color_index += 1;
            }
            console.log("labelProperty:", labelProperty);
            neo4jd3.cleanGraph();
            $.each(d.nodes, function (i, val) {
                if(d.nodes[i]["labels"][0]=="API Method") {
                    d.nodes[i]["name"] = get_simple_name(d.nodes[i]["name"]);
                }
                d.nodes[i]["x"] = $("#GraphContainer").width() / 2;
                d.nodes[i]["y"] = $("#GraphContainer").height() / 2;
                getLabelSet(val.labels);
                getLabelStatusList(val.labels);
            });
            let new_nodes = d.nodes;
            let new_relations = [];
            for (let relation of d.relations) {
                let new_relation = {};
                new_relation["id"] = relation.id;
                new_relation["source"] = relation.start_id;
                new_relation["target"] = relation.end_id;
                new_relation["startNode"] = relation.start_id;
                new_relation["endNode"] = relation.end_id;
                new_relation["type"] = relation.name;
                new_relation["properties"] = {};
                new_relations.push(new_relation);
            }
            console.log("第一次加载new_relations:",new_relations);
            let D3Data = {
                "nodes": new_nodes,
                "relationships": new_relations
            };
            neo4jd3.updateWithD3Data(D3Data);
            neo4jd3.nodesColor();
            nodesAndRelations.push(D3Data);
            console.log("第一次加载nodeandrelation :",nodesAndRelations);
            console.log("加载时labelstuteliae:",labelStatusList);
            console.log(d);
        }
    });
}

function onNodeDoubleClick(d) {
    let nodeID = d.id;
    let dx = d.x;
    let dy = d.y;
    let parametersJson = {"id": nodeID};
    $.ajax({
        url: "http://bigcode.fudan.edu.cn/dysd3/expandNode/",
        type: "post",
        data: JSON.stringify(parametersJson),
        contentType: "application/json; charset=utf-8",
        dataType: 'json',
        error: function (xhr, status, errorThrown) {
            // alert("ERROR");
            // alert("Error: " + errorThrown);
            // alert("Status: " + status);
            console.log(xhr);
        },
        success: function (d) {
            if (d === "fail") {
                return
            }
            var labels = []
            $.each(d.nodes, function (i, val) {
                if(labels_set.has(d.nodes[i]["labels"][0])==false) {
                    labels_set.add(d.nodes[i]["labels"][0]);
                    var color_label = {};
                    color_index=all_labels_color.indexOf(value);
                    color_label["color"] = generateRandomColor(color_index);
                    color_label["name"] = d.nodes[i]["labels"][0];
                    //console.log("color_label", color_label);
                    labelProperty.push(color_label);
                    //color_index += 1;
                }
            });
            console.log("labelProperty:", labelProperty);
            $.each(d.nodes, function (i, val) {
                if(d.nodes[i]["labels"][0]=="API Method") {
                    d.nodes[i]["name"] = get_simple_name(d.nodes[i]["name"]);
                }
                d.nodes[i]["x"] = dx;
                d.nodes[i]["y"] =dy;
                getLabelSet(val.labels);
                getLabelStatusList(val.labels);
            });
            let new_nodes = d.nodes;
            let new_relations = [];
            for (let relation of d.relations) {
                let new_relation = {};
                new_relation["id"] = relation.id;
                new_relation["source"] = relation.start_id;
                console.log("relation.start_id:",relation.start_id);
                new_relation["target"] = relation.end_id;
                new_relation["startNode"] = relation.start_id;
                console.log("relation.startNode:",relation.start_id);
                new_relation["endNode"] = relation.end_id;
                new_relation["type"] = relation.name;
                new_relation["properties"] = {};
                console.log("new_relation:",new_relation);
                new_relations.push(new_relation);
            }
            console.log("扩展new_relations:",new_relations);
            for(var i=0;i<new_relations.length;i++){
                console.log(new_relations[i]);
                console.log(i,typeof(new_relations[i]["source"]));
                if(typeof(new_relations[i]["source"])=="number"){
                    for(var j=0;j<new_nodes.length;j++){
                        if(new_nodes[j]["id"]==new_relations[i]["source"]){
                            new_relations[i]["source"]=new_nodes[j];
                            break;
                        }
                    }
                    for(var j=0;j<new_nodes.length;j++){
                        if(new_nodes[j]["id"]==new_relations[i]["target"]){
                            new_relations[i]["target"]=new_nodes[j];
                            break;
                        }
                    }
                }
            }
            console.log("扩展改后new_relations:",new_relations);
            let D3Data = {
                "nodes": new_nodes,
                "relationships": new_relations
            };
            neo4jd3.updateWithD3Data(D3Data);
            //getRelationStatusList(d.relations);
            neo4jd3.nodesColor();
            //getRelationSet(d.relations);
            //getRelationStatusList(d.relations);
            nodesAndRelations.push(D3Data);
            console.log("扩展nodeandrelation :",nodesAndRelations);
            console.log("click expand node: ",d);
        }
    });

}

//从长名字中截取class+method
function get_simple_name(long_name) {
    if (long_name.indexOf("(") != -1) {
        var spilt_result = long_name.split('(');
        var method = spilt_result[1];
        method = "(" + method;
        var sp_class = spilt_result[0].split('.');
        var simple_class = sp_class[sp_class.length - 2] + "." + sp_class[sp_class.length - 1];
        return simple_class + method;
    } else {
        var sp_class = long_name.split('.');
        var simple_class = sp_class[sp_class.length - 1];
        return simple_class;
    }
}
//从长名字中截取method
function get_simple_method_name(long_name) {
    if (long_name.indexOf("(") != -1) {
        var spilt_result = long_name.split('(');
        var method_pa = spilt_result[1];
        method_pa = "(" + method_pa;
        var method_pre = spilt_result[0].split('.');
        var method = method_pre[method_pre.length - 1]+method_pa;
        return method;
    }
}


//具体method中more_detail折叠事件
function click_for_more_details(click,item, method_kg_id) {
    var content = $(item[0]).css('display');
    console.log("display :",content);
    console.log("ahidhdhof :",$(item[0]).html());
    console.log("ahidhdhof@@@@@@@@@@@ :",$(item[0]).html().length);
    if ($(item[0]).html().length<25 ) {//第一次加载点开展开
        console.log("@@@@@@:",content);
        get_functional_sentences(method_kg_id, method_mode,item[0]);
        get_directive_sentences(method_kg_id, method_mode,item[1]);
        get_releated_post(method_kg_id, method_mode,item[2]);
        get_example_code(method_kg_id, method_mode,item[3]);
        $(item[0]).show();
        $(item[1]).show();
        $(item[2]).show();
        $(item[3]).show();
    } else if (content != "none" && $(item[0]).html().length>25){//折叠
        $(item[0]).css('display', 'none');
        $(item[1]).css('display', 'none');
        $(item[2]).css('display', 'none');
        $(item[3]).css('display', 'none');
    }else if(content == "none" && $(item[0]).html().length>25){//展开
        $(item[0]).show();
        $(item[1]).show();
        $(item[2]).show();
        $(item[3]).show();

    }
}


//具体method中more_detail折叠事件
function click_for_more_details_new(item, method_kg_id) {
    var content = $(item).html();
    var getDisplay = $(item).css('display');
    if (content == "Click For More Details" && getDisplay != "none") {//第一次点击
        get_functional_sentences(method_kg_id, method_mode, item);
        get_directive_sentences(method_kg_id, method_mode, item);
        get_releated_post(method_kg_id, method_mode, item)
        get_example_code(method_kg_id, method_mode, item)
    } else if (content != "Click For More Details" && getDisplay == "none") {//原来有内容，点击展开
        $(item).show();
        $(item).html("Click For More Details");
    } else if (content != "Click For More Details" && getDisplay != "none") {//原来有内容，点击折叠
        $(item).css('display', 'none');
    }
}

//刷新按钮事件
function refresh() {
    window.location.href = "http://bigcode.fudan.edu.cn/OpenAPIDocGen/";
}

function show_hide_graph(){
    var getDisplay = $(".showGroup").css('display');
    if(getDisplay != "none"){
        $(".showGroup").css('display', 'none');
    }else{
        $(".showGroup").show();
    }
}

//搜索按钮事件
function jumpClick() {
    $(".accordion").css('list-style-type', 'none');
    $("#inheritance").html("");
    $("#code_description").html("");
    $("#method_summary_tbody").html("");
    $("#bt3").css('display', 'none');
    var textvalue = $("input[class='form-control']").val();
    if (textvalue.length != '') {
        class_releated_concept=[];
        $(".details").show();
        $(".description").show();
        $.ajax({
            async: true,
            url: "http://bigcode.fudan.edu.cn/dysd3/APISearch/",
            type: "post",
            contentType: "application/json; charset=utf-8",
            data: JSON.stringify({"query": textvalue}),
            error: function (xhr, status, errorThrown) {
                console.log("Error " + errorThrown);
                console.log("Status: " + status);
                console.log(xhr);
            },
            success: function (d) {
                console.log("api search:", d);
                class_kg_id = d.kg_id;
                class_releated_concept=d.related_concept;
                console.log("class_releated_concept:", class_releated_concept);
                console.log("kg_id:", class_kg_id);
                //get_class_description(class_kg_id);
                if(class_releated_concept){
                    $("#class_releated_concept").append("<br/><dt><span class=\"seeLabel\">Releated Concept:</span></dt>");
                    $("#class_releated_concept_script").tmpl(class_releated_concept).appendTo("#class_releated_concept");
                    $("#class_releated_concept").show();
                }
                // $("#accordion").show();
                // $("#bt3").show();
                // get_inheritance_tree(class_kg_id);
                // get_class_description(class_kg_id);
                // get_class_releated_api(class_kg_id);
                // get_method_detail(class_kg_id);
                // get_releated_post(class_kg_id, class_mode,0);
                // get_example_code(class_kg_id, class_mode,0);
                // get_functional_sentences(class_kg_id, class_mode, 0);
                // get_directive_sentences(class_kg_id, class_mode, 0);
                // get_expand_nodes(class_kg_id);
                console.log("first loading,auto@@@@@@@@@@@");
                window.location.href = "?kg_id=" + class_kg_id;
            }
        });
    } else {
        $(".details").css('display', 'none');
        $(".description").css('display', 'none');
        $("#showGroup").css('display', 'none');
        $(".accordion").css('display', 'none');
        $("#bt3").css('display', 'none');
        $("#show_class_name").css('display', 'none');
        $("#show_class_name").html("");
        $("#class_description").html("");
        $("#method_detail").html("");
        $("#post_detail").html("");
        $("#inheritance").html("");
        $("#code_description").html("");
        window.location.href = "";
        alert("empty input");
    }
}

//输入框判断回车
function keyup_submit(e) {
    var evt = window.event || e;
    if (evt.keyCode == 13) {
        jumpClick();
    }
}

//外层折叠框
$(function () {
    var Accordion = function (el, multiple) {
        this.el = el || {};
        this.multiple = multiple || false;

        // Variables privadas
        var links = this.el.find('.link');
        // Evento
        links.on('click', {el: this.el, multiple: this.multiple}, this.dropdown)
    }

    Accordion.prototype.dropdown = function (e) {
        var $el = e.data.el;
        $this = $(this),
            $next = $this.next();

        $next.slideToggle();
        $this.parent().toggleClass('open');

        if (!e.data.multiple) {
            $el.find('.submenu').not($next).slideUp().parent().removeClass('open');
        }
        ;
    }
    var accordion = new Accordion($('#accordion'), false);
});

//添加labelStatueList
function getLabelStatusList(labels) {
    if (labels) {
        for (let i = 0; i < labels.length; i++) {
            let flag = true;
            for (let j = 0; j < labelStatusList.length; j++) {
                if (labels[i] === labelStatusList[j].name) {
                    flag = false;
                    break;
                }
            }
            if (flag) {
                let temp = {};
                temp["name"] = labels[i];
                temp["status"] = true;
                labelStatusList.push(temp);
            }

        }
    }
}

function getRelationStatusList(relations) {
    if (relations) {
        for (let i = 0; i < relations.length; i++) {
            let flag = true;
            for (let j = 0; j < relationStatusList.length; j++) {
                if (relations[i] === relationStatusList[j].name) {
                    flag = false;
                    break;
                }
            }
            if (flag) {
                let temp = {};
                temp["name"] = relations[i];
                temp["status"] = true;
                relationStatusList.push(temp);
            }
        }

    }
}

let inputType = "search";

$("#SX").click(function () {
    neo4jd3.nodesData()
});

function keyDown() {
    if (event.keyCode == 46) deletaNode();
}

document.onkeydown = keyDown;

function deletaNode() {
    if (currentnodeID === "-1") {
        return alert("Please choose a node!")
    }

    neo4jd3.removeNodeAndRelationshipsByNodeID(currentnodeID);
    $("#flowPanel").html("<span>You can cilck the node to know about the information about it.<br>The information you want to know will display here.</span>");
}

//选择label
function labelCheckClick(name) {
    console.log("前labelStatusList: ",labelStatusList);
    let checkName = "label-" + name;
    /*    console.log(checkName);
        console.log(document.getElementById(checkName));
        console.log(document.getElementById(checkName).checked);*/
    if (document.getElementById(checkName).checked) {
        changeLabelStatus(name, true);
        repaintNodes();
    } else {
        changeLabelStatus(name, false);
        repaintNodes();
    }
}

function repaintNodes() {
    console.log("画点repaintNodes @@@ nodesAndRelations" ,nodesAndRelations);
    let originTypeList = getRelationTypes(nodesAndRelations);
    neo4jd3.cleanGraph();
    let tempNR = cloneObj(nodesAndRelations);
    console.log("画点labelStatusList :",labelStatusList);
    for (let i = 0; i < labelStatusList.length; i++) {
        for (let j = 0; j < tempNR.length; j++) {
            for (let k = 0; k < tempNR[j].relationships.length; k++) {
                let source = tempNR[j].relationships[k].source;
                let target = tempNR[j].relationships[k].target;
                // console.log("source labels :", k ,source.labels);
                if (labelStatusList[i].status === false && (labelStatusList[i].name === source.labels[0] || labelStatusList[i].name === target.labels[0])) {
                    tempNR[j].relationships.splice(k, 1);
                    k = k - 1;
                }

            }
        }
    }
    for (let i = 0; i < labelStatusList.length; i++) {
        for (let j = 0; j < tempNR.length; j++) {
            for (let k = 0; k < tempNR[j].nodes.length; k++) {
                let labels = tempNR[j].nodes[k].labels;
                if (labelStatusList[i].status === false && labelStatusList[i].name === labels[0]) {
                    tempNR[j].nodes.splice(k, 1);
                    k = k - 1;
                }
            }
        }

    }

    let newTypeList = getRelationTypes(tempNR);
    console.log(newTypeList);

    changeRelationCheckboxStatus(originTypeList, newTypeList);

    //repaintEntityList(tempNR);

    for (let i = 0; i < tempNR.length; i++) {
        for (let j = 0; j < tempNR[i].relationships.length; j++) {
            let new_relation = {};
            new_relation["id"] = tempNR[i].relationships[j].id;
            new_relation["source"] = tempNR[i].relationships[j].startNode;
            new_relation["target"] = tempNR[i].relationships[j].endNode;
            new_relation["startNode"] = tempNR[i].relationships[j].startNode;
            new_relation["endNode"] = tempNR[i].relationships[j].endNode;
            new_relation["type"] = tempNR[i].relationships[j].type;
            new_relation["properties"] = {};
            tempNR[i].relationships.splice(j, 1, new_relation);
        }
    }

    for (let i = 0; i < tempNR.length; i++) {
        neo4jd3.updateWithD3Data(tempNR[i]);
    }
    console.log("画点nodesAndRelations： ",nodesAndRelations);
}

function cloneObj(obj) {
    let str, newobj = obj.constructor === Array ? [] : {};
    if (typeof obj !== 'object') {
        return;
    } else if (window.JSON) {
        str = JSON.stringify(obj); //系列化对象
        newobj = JSON.parse(str); //还原
    } else {
        for (let i in obj) {
            newobj[i] = typeof obj[i] === 'object' ?
                cloneObj(obj[i]) : obj[i];
        }
    }
    return newobj;
}

function changeLabelStatus(label, status) {
    for (let i = 0; i < labelStatusList.length; i++) {
        if (labelStatusList[i].name === label) {
            labelStatusList[i].status = !labelStatusList[i].status;
            return;
        }
    }
    console.log("labelStatusList+++: ",labelStatusList);
    let temp = {};
    temp["name"] = label;
    temp["status"] = status;
    labelStatusList.push(temp);
    console.log("labelStatusList___: ",labelStatusList);
}

function changeRelationStatus(relation, status) {
    for (let i = 0; i < relationStatusList.length; i++) {
        if (relationStatusList[i].name === relation) {
            relationStatusList[i].status = !relationStatusList[i].status;
            return;
        }
    }
    let temp = {};
    temp["name"] = relation;
    temp["status"] = status;
    relationStatusList.push(temp);
}

function getRelationTypes(nodesAndRelations) {
    let type_list = [];
    for (let i = 0; i < nodesAndRelations.length; i++) {
        for (let j = 0; j < nodesAndRelations[i].relationships.length; j++) {
            if ($.inArray(nodesAndRelations[i].relationships[j].type, type_list) === -1) {
                type_list.push(nodesAndRelations[i].relationships[j].type);
            }
        }
    }
    return type_list;
}

function changeRelationCheckboxStatus(originTypes, newTypes) {
    for (let i = 0; i < originTypes.length; i++) {
        let relationCheckboxName = "relation-" + originTypes[i];
        if ($.inArray(originTypes[i], newTypes) === -1) {
            // $(relationCheckboxName).attr("checked", false);
            // document.getElementById(relationCheckboxName).checked = false;
            // console.log(document.getElementById(relationCheckboxName).checked);
            relationStatusList[originTypes[i]] = false;
            for (let j = 0; j < relationStatusList.length; j++) {
                if (relationStatusList[j].name === originTypes[i]) {
                    relationStatusList[j].status = false;
                }
            }
        } else {
            // $(relationCheckboxName).attr("checked", true);
            //document.getElementById(relationCheckboxName).checked = true;
            // console.log(document.getElementById(relationCheckboxName).checked);
            for (let j = 0; j < relationStatusList.length; j++) {
                if (relationStatusList[j].name === originTypes[i]) {
                    relationStatusList[j].status = true;
                }
            }
        }
    }
}

function getNodeLabels(nodesAndRelations) {
    let label_list = [];
    for (let i = 0; i < nodesAndRelations.length; i++) {
        for (let j = 0; j < nodesAndRelations[i].relationships.length; j++) {
            for (let k = 0; k < nodesAndRelations[i].relationships[j].source.labels.length; k++) {
                if ($.inArray(nodesAndRelations[i].relationships[j].source.labels[k], label_list) === -1) {
                    label_list.push(nodesAndRelations[i].relationships[j].source.labels[k]);
                }
            }
            for (let k = 0; k < nodesAndRelations[i].relationships[j].target.labels.length; k++) {
                if ($.inArray(nodesAndRelations[i].relationships[j].target.labels[k], label_list) === -1) {
                    label_list.push(nodesAndRelations[i].relationships[j].target.labels[k]);
                }
            }
        }
    }
    return label_list;
}

function changeLabelCheckboxStatus(newLabels) {
    for (let i = 0; i < newLabels.length; i++) {
        let labelCheckboxName = "label-" + newLabels[i];
        if (document.getElementById(labelCheckboxName).checked === false) {
            document.getElementById(labelCheckboxName).checked = true;
            for (let j = 0; j < labelStatusList.length; j++) {
                if (labelStatusList[j].name === newLabels[i]) {
                    labelStatusList[j].status = true;
                }
            }
        }
    }
}


