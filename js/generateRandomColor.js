function generateRandomColor(i){
    let color = ["#33aefc",
        "#FFCCA2",
        "#C1FF89",
        "#A0FFC1",
        "#8BEBFF",
        "#B3B0FF",
        "#FF93E0",
        "#FF6D81",
        "#66C1FF",
        "#FF4C75",
        "#AE5DFF",
        "#6D8CFF",
        "#41FF6F",
        "#FFCE44",
        "#3DC0FF",
        "#62FF95",
        "#FF4A4C",
        "#FF3586",
        "#A5EEFF",
        "#62FF23",
        "#A658FF",
        "#BE8EFF",
        "#FFA36A",
        "#67F2FF",
        "#ED698C",
        "#FFDA4C",];
    //不知道怎么随机生成比较明亮的颜色，老是有颜色比较深的点，以后标签增加后不要忘记继续添加0.0
    return color[i];
}


/*function generateRandomColor(){
    let red = parseInt(Math.random()*239 + 16).toString(16);
    let blue = parseInt(Math.random()*239 + 16).toString(16);
    let green= parseInt(Math.random()*239 + 16).toString(16);
    return '#' + red + blue + green;
}*/

