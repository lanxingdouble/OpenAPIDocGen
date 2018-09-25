var dragtag = 0;    //var tag to isDrag

//display action function
function hideOrDisplayPanel() {
    $("#flowPanel").fadeToggle("fast");
}
/*
$(document).click(function () {
    $("#searchResult").fadeOut();
});*/

$("#searchResult").click(function (event) {
    event.stopPropagation();
});
//click function
$("circle").click(function () {
    var nodename = $(this).attr("name");
    var nodeID = $(this).attr("id");
    var paneltext;

    $.ajax({
        async: false,
        url: "http://bigcode.fudan.edu.cn/kg/getNodeByID/",
        type: "post",
        data: '{"id":' + nodeID + '}',
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        error: function (xhr, status, errorThrown) {
            // alert("ERROR");
            // alert("Error: " + errorThrown);
            // alert("Status: " + status);
            // alert(xhr);
        },
        success: function (d) {
            console.log(d);
            paneltext = JSON.stringify(d);
            console.log(paneltext);
        }
    });

    let text = "<span>" + paneltext + "</span>";
    text += "<br>";
    text += "<br>";
    text += "<button id='nodesOpen' value='" + $(this).attr("id") + "' class='btn btn-info btn-sm'>Open</button>";
    text += "<button id='nodesDelate' class='btn btn-danger btn-sm' style='margin-left: 5%'>Delate</button>";
    let intoWiki = "click here to wiki page";

    $("#flowPanel").html(text);
    $("#flowPanel").prepend(intoWiki);
    $("#flowPanel").fadeIn("fast");
    $("#nodesDelate").click(function () {
        $("[source=" + nodeID + "]").hide();
        $("[target=" + nodeID + "]").hide();
        $("circle[id=" + nodeID + "]").hide();
        $("#flowPanel").html("You can cilck the node to know about the information about it.<br>The information you want to know will display here.")
    });

    openClick();

});

function openClick() {
    var nodeID = $("#nodesOpen").attr('value');
    var passid = '{"id": ' + $("#nodesOpen").attr('value') + '}';
    $("#nodesOpen").click(function () {
        $.ajax({
            async: false,
            url: "http://bigcode.fudan.edu.cn/kg/expandNode/",
            type: "post",
            data: passid,
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            error: function (xhr, status, errorThrown) {
                // alert("ERROR")
                // alert("Error: " + errorThrown);
                // alert("Status: " + status);
                // alert(xhr);
            },
            success: function (d) {
                if (JSON.stringify(links_data) === "[{}]") links_data.length--;
                // alert(links_data.length)

                var panelText = [];

                var new_nodes = [];
                for (var i = 0; i < d.nodes.length; i++) {
                    new_nodes[i] = {"name": "" + d.nodes[i].name + "", "id": "" + d.nodes[i].id + ""}
                }

                $.extend(nodes_data, nodes_data, new_nodes);

                var new_links = [];
                console.log(JSON.stringify(links_data))


                for (var j = links_data.length; j < d.relations.length; j++) {
                    new_links[j] = {
                        "source": "" + d.relations[j].start_id + "",
                        "target": "" + d.relations[j].end_id + ""
                    }
                    $.extend(links_data, links_data, new_links);
                    // alert(JSON.stringify(links_data))
                }

                console.log(JSON.stringify(links_data))

                // alert(1)
                restart();
                // alert(2)

                $("line:first").attr("source", d.relations[0].start_id);

                $("line:first").attr("target", d.relations[0].end_id);

                $("[source=" + nodeID + "]").show();
                $("[target=" + nodeID + "]").show();
                for (var i = 0; i < $("[source=" + nodeID + "]").length; i++) $("circle[id=" + $("[source=" + nodeID + "]")[i].__data__.source.id + "]").show();
                for (var j = 0; j < $("[source=" + nodeID + "]").length; j++) $("circle[id=" + $("[source=" + nodeID + "]")[j].__data__.target.id + "]").show();
                for (var k = 0; k < $("[target=" + nodeID + "]").length; k++) $("circle[id=" + $("[target=" + nodeID + "]")[k].__data__.source.id + "]").show();
                for (var l = 0; l < $("[target=" + nodeID + "]").length; l++) $("circle[id=" + $("[target=" + nodeID + "]")[l].__data__.target.id + "]").show();

                drag_handler(node);

                $(function () {
                    //hover display
                    $("circle").mouseover(function (e) {
                        //get mouse position
                        if (dragtag === 0) {
                            var mousePos = mousePosition(e);
                            var xOffset = 0;
                            var yOffset = 25;
                            $("#tooltip").css("display", "block").css("position", "absolute").css("top", (mousePos.y - yOffset) + "px").css("left", (mousePos.x + xOffset) + "px");
                            $("#tooltip").html($(this).attr("name"));
                        }

                    });
                    //hide display
                    $("circle").mouseout(function () {
                        $("#tooltip").empty();
                        $("#tooltip").css("display", "none");
                    });

                });

                $("circle").click(function () {
                    var nodename = $(this).attr("name");
                    var nodeID = $(this).attr("id");
                    var paneltext;

                    $.ajax({
                        async: false,
                        url: "http://bigcode.fudan.edu.cn/kg/getNodeByID/",
                        type: "post",
                        data: '{"id":' + nodeID + '}',
                        contentType: "application/json; charset=utf-8",
                        dataType: "json",
                        error: function (xhr, status, errorThrown) {
                            // alert("ERROR")
                            // alert("Error: " + errorThrown);
                            // alert("Status: " + status);
                            // alert(xhr);
                        },
                        success: function (d) {
                            paneltext = JSON.stringify(d)
                        }
                    });

                    var text = "<span>" + paneltext + "</span>";
                    text += "<br>"
                    text += "<br>"
                    text += "<button id='nodesOpen' value='" + $(this).attr("id") + "' class='btn btn-info btn-sm'>Open</button>";
                    text += "<button id='nodesDelate' class='btn btn-danger btn-sm' style='margin-left: 5%'>Delate</button>"
                    $("#flowPanel").html(text);
                    $("#flowPanel").fadeIn("fast");
                    $("#nodesDelate").click(function () {
                        $("[source=" + nodeID + "]").hide();
                        $("[target=" + nodeID + "]").hide();
                        $("circle[id=" + nodeID + "]").hide();
                        $("#flowPanel").html("You can cilck the node to know about the information about it.<br>The information you want to know will display here.")
                    })

                    openClick();
                })
            }
        })
    })
}