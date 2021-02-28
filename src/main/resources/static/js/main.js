//初始化表情包
function initEmoji() {
    let $emoji = $(".popup.emoji");
    let root = $emoji.attr("href");
    let size = $emoji.attr("size");
    let $currentRow;
    for (let i = 0; i < size; i++) {
        if (i === 0 || i % 10 === 0) {
            $currentRow = $("<tr></tr>");
            $currentRow.appendTo($(".emoji .table tbody"));
        }
        $(format("<td><img class='ui emoji image' src='{0}{1}.png'></div></td>", [root, i + ""])).appendTo($currentRow);
    }
    $(".emoji .table tbody img").click(function () {
        $(this).clone().appendTo("#text_area")
    });
    $("#emoji_button").popup({
        on: "click",
        hover: true
    });

}

$(function () {
    initEmoji();
    onOpen();
});


let ws;
let currentUser

function sendMsg() {

    $("#text_area img:not(.emoji)").each((index, item) => {
        ws.send("$img" + $(item).prop("outerHTML")); // 单独发送图片消息
    });
    $("#text_area img:not(.emoji)").remove(); // 删除图片元素
    if ($("#text_area").html().trim() === "") {
        return; // 不发空消息
    }
    let html = $("#text_area").html();
    if (html.length > 2048) {
        alert("内容太长了");
        return;
    }
    ws.send($("#text_area").html());// 发送其它消息
    $("#text_area").empty(); // 清空消息
    // 拆分消息
}

function onOpen() {
    let name = prompt("输入用户名", "");
    ws = new WebSocket("ws://" + window.location.host + "/chat/" + name)
    currentUser = name;
    ws.onmessage = onmessage;
    // 发送消息
    $("#send_button").click(function () {
        sendMsg();
    })
}

let user_item_template = '<div class="item">\n' +
    '                    <img class="ui avatar image" src="/images/{0}">\n' +
    '                    <div class="content" style="margin-top: 5px">\n' +
    '                        <div class="user name">{1}</div>\n' +
    '                    </div>\n' +
    '                </div>';

let msg_item_template =
    '<div class="item">\n' +
    '                    <img class="ui avatar image" src="/images/{0}">\n' +
    '                    <div class="content">\n' +
    '                        <div class="user name">{1}</div>\n' +
    '                        <label class="ui left pointing label ">{2}</label>\n' +
    '                    </div>\n' +
    '                </div>';
let msg_item_current_tempate = '<div class="item current">\n' +
    '                        <img class="ui avatar image" src="/images/{1}">\n' +
    '                    <div class="right floated content">\n' +
    '                        <label class="ui right pointing label green ">\n' +
    '                            {0}' +
    '                        </label>\n' +
    '                    </div>\n' +
    '                </div>';
let img_msg_item_template='<div class="item ">\n' +
    '                    <img class="ui avatar image" src="./images/{0}">\n' +
    '                    <div class="content">\n' +
    '                        <div class="user name">{1}</div>\n' +
    '                       <a href="javascript:void(0)" onclick="openImage(this);">  {2}</a>\n' +
    '                    </div>\n' +
    '                </div>';
let  img_msg_item_current_template='<div class="item current">\n' +
    '                    <div class="right floated content">\n' +
    '                        <img class="ui avatar image" src="./images/{0}">\n' +
    '                    </div>\n' +
    '                   <a href="javascript:void(0)" onclick="openImage(this);"> {1}</a>\n' +
    '                </div>';

function onmessage(event) {
    let data = JSON.parse(event.data);
    if (data.type === "err_user_exist") {
        alert("用户名已存在");
        window.location.reload();
    } else if (data.type === "update_user") {
        $("#user_list").empty();
        data.users.forEach((user) => {
            $(format(user_item_template, [user.head, user.name])).appendTo("#user_list");
        });
        $("#user_count").text(data.users.length);
    } else if (data.type === "normal_msg") {
        if (data.user.name === currentUser) {
            let $item = $(format(msg_item_current_tempate, [data.msg, data.user.head]));
            $item.appendTo("#msg_list");
        } else {
            let $item = $(format(msg_item_template, [data.user.head, data.user.name, data.msg]));
            $item.appendTo("#msg_list");
        }
        refreshMessage();
    } else if (data.type === "img_msg") {
        if (data.user.name === currentUser) {
            let $item = $(format(img_msg_item_current_template, [data.user.head,data.msg]));
            $item.appendTo("#msg_list");
        } else {
            let $item = $(format(img_msg_item_template, [data.user.head, data.user.name, data.msg]));
            $item.appendTo("#msg_list");
        }
        refreshMessage();
    }
}
// 消息滚动条显示至底部
function  refreshMessage(){
    $("#msg_list")[0].scrollTop=$("#msg_list")[0].scrollHeight;
}

function format(format, args) {
    return format.replace(/\{(\d+)\}/g, function (m, n) {
        return args[n] ? args[n] : m;
    });
}
//放大图片
function openImage(item) {
    $("#image_dialog img").attr('src', $(item).find("img").attr('src'));
    $("#image_dialog").modal('show');
}