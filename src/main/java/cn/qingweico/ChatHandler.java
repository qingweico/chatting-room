package cn.qingweico;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

import javax.websocket.*;
import javax.websocket.server.PathParam;
import javax.websocket.server.ServerEndpoint;
import java.io.IOException;
import java.io.Serializable;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * @author 周庆伟
 * @date 2020/11/14
 */
@ServerEndpoint("/chat/{uid}")
@Controller
   public class ChatHandler {

    private static final String SUFFIX = "$img";

    @GetMapping("/")
    public String index() {
        return "redirect:/chat.html";
    }

    /**
     * 当前在线用户
     */
    static Map<String, Session> sessions = new ConcurrentHashMap<>();

    /**
     * 随机为用户生成头像
     */
    String[] headImage = new String[]{
            "christian.jpg",
            "daniel.jpg",
            "elliot.jpg",
            "helen.jpg",
            "jenny.jpg",
            "lena.png",
            "lindsay.png",
            "mark.png",
            "matt.jpg",
            "molly.png",
            "steve.jpg",
            "stevie.jpg",
            "tom.jpg",
            "veronika.jpg"};

    @OnOpen
    public void onOpen(Session session, @PathParam("uid") String uid) {
        // 用户上线
        // 随机生成头象
        if (ChatHandler.sessions.containsKey(uid)) {
            System.err.println("用户已存在：" + uid);
            Map<String, String> map = new HashMap<>(5);
            map.put("type", "err_user_exist");
            try {
                session.getBasicRemote().sendText(toJson(map));
            } catch (IOException e) {
                e.printStackTrace();
            }
            return;
        }
        String header = headImage[new Random().nextInt(headImage.length)];
        User user = new User(header, uid);
        session.getUserProperties().put("user", user);
        ChatHandler.sessions.put(uid, session);
        fireUpdateUsers();
    }

    /**
     * 更新用户列表
     */
    private void fireUpdateUsers() {
        List<User> userList = sessions.values().stream().map(s ->
                (User) s.getUserProperties().get("user")).collect(Collectors.toList());
        Map<String, Object> message = new HashMap<>(5);
        message.put("type", "update_user");
        message.put("users", userList);
        ObjectMapper mapper = new ObjectMapper();
        String json = null;
        try {
            json = mapper.writeValueAsString(message);
        } catch (JsonProcessingException e) {
            e.printStackTrace();
        }
        // 给所有用户发送消息
        for (Session session : sessions.values()) {
            try {
                session.getBasicRemote().sendText(json);
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }


    @OnClose
    public void onClose(Session session) {
        User user = (User) session.getUserProperties().get("user");
        sessions.remove(user.name);
        fireUpdateUsers();
    }

    private String toJson(Object value) {
        ObjectMapper mapper = new ObjectMapper();
        String json = null;
        try {
            json = mapper.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            e.printStackTrace();
        }
        return json;
    }

    @OnMessage
    public void onMessage(Session currentSession, String msg) throws IOException {
        Map<String, Object> message = new HashMap<>(5);
        if (msg.startsWith(SUFFIX)) {
            // 图片
            message.put("type", "img_msg");
            message.put("msg", msg.substring(4));
        } else {
            //普通消息
            message.put("type", "normal_msg");
            message.put("msg", msg);
        }
        message.put("user", currentSession.getUserProperties().get("user"));
        // 接收消息
        for (Session session : sessions.values()) {
            session.getBasicRemote().sendText(toJson(message));
        }
    }

    @OnError
    public void onError(Throwable e) {
        e.printStackTrace();
    }

    public static class User implements Serializable {
        public String head;
        public String name;

        public User(String header, String name) {
            this.head = header;
            this.name = name;
        }
    }
}
