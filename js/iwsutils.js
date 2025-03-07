class SAPUtil {
    appendHTML(content) {
        $("#content").append(content);
    }
    loadScript(src) {
        var script = document.createElement('script');
        script.src = src;
        script.async = false;
        document.head.appendChild(script);
    }
    updateConnectionLed(clazz, msg) {
        $("#led").removeClass();
        $("#led").addClass(clazz);
        $(".led-msg p").text(msg);
    }
    insertString(str, index, value) {
        return str.substr(0, index) + value + str.substr(index);
    }
    converToUUID(id) {
        id = saputil.insertString(id, 8, '-');
        id = saputil.insertString(id, 13, '-');
        id = saputil.insertString(id, 18, '-');
        id = saputil.insertString(id, 23, '-');
        return id;
    }
    receiveMessage(msg) {
        loggerSap.info("receivedPostMessage : ", msg?.data);
        if (msg?.data?.Direction == 'OUT' && msg?.data?.PhoneNumber) {
            var phone = msg.data.PhoneNumber.replace(" ", "");
            if (pcEnvironment) {
                let call = {
                    number: phone,
                    type: "call",
                    autoPlace: true,
                    attributes: {
                        activity_uuid: msg.data.ActivityUUID || msg.data.ObjectUUID
                    }
                };
                iwscommand.clickToDialPEF(call);
            }
            else {
                iwscommand.MakeCall(phone, { activity_uuid: msg.data.ActivityUUID });
            }
        }
        else if (msg?.data?.InteractionId) {
            loggerSap.info("opening recording id : ", msg?.data?.InteractionId);
            if (msg?.data?.InteractionId) {
                const id = saputil.converToUUID(msg?.data?.InteractionId);
                window.open(`https://apps.${pcEnvironment}/directory/#/engage/admin/interactions/${id}`, '_blank', 'location=yes,height=800,width=1280,scrollbars=yes,status=yes');
            }
        }
    }
    replaceAll(string, search, replace) {
        return string.split(search).join(replace).toUpperCase();
    }
    buildANI(num) {
        if (num.indexOf("tel:") > -1) {
            return num.replace("tel:", "");
        }
        if (num.indexOf("sip:") > -1) {
            let app = num.replace("sip:", "");
            return app.substr(0, app.indexOf("@"));
        }
        return num;
    }
    manageTranscript(message) {
        loggerSap.info("manageTranscript : ", message);
        if (!message?.data?.id) {
            loggerSap.info("manageTranscript returning, missing id....");
            return;
        }
        var externalId = saputil.replaceAll(message.data.id, "-", "");
        var interaction = iwscore.mapInteractions[message.data.id];
        if (interaction?.attachdata?.message_id) {
            externalId = interaction?.attachdata?.message_id;
        }
        var transcript = this.createTranscript(message);
        var channelId = message.data?.messages[0]?.type || "chat";
        var payload = {
            Type: this.checkSapType(channelId),
            EventType: "UPDATEACTIVITY",
            ExternalReferenceID: externalId,
            Action: "END",
            Transcript: transcript,
            ChannelId: channelId
        };
        loggerSap.info("*** posting message : ", payload);
        parent.postMessage({ payload: payload }, "*");
    }
    createTranscript(message) {
        var channelId = message.data?.messages[0]?.type || "chat";
        var genesysUrl = 'https://apps.' + pcEnvironment + '/directory/#/engage/admin/interactions/' + message.data.id;
        var transcript = 'Genesys Media Type: ' + channelId + '\nGenesys Interaction Id: ' + message.data.id;
        transcript += '\nGenesys Interaction URL: ' + genesysUrl + "\n";
        transcript += '\nTranscript\n';
        if (message && message.data && message.data.messages) {
            message.data.messages.forEach(msg => {
                transcript += "\n" + msg.role + ": " + msg.body;
            });
        }
        console.log('createTranscript: ', transcript);
        return transcript;
    }
    normalizeMessages(messages) {
        var msgs = { data: { messages: [] } };
        messages.forEach(data => {
            var m = {
                role: data.fromAddress || '',
                to: data.toAddress || '',
                body: data.textBody || '',
                time: data.timestamp || '',
                direction: data.direction || '',
                type: data.messengerType || ''
            };
            msgs.data.messages.push(m);
        });
        msgs.data.messages.sort(function (a, b) {
            var dateA = new Date(a.time).getTime();
            var dateB = new Date(b.time).getTime();
            return dateA - dateB;
        });
        console.log('normalizeMessages: ', msgs);
        return msgs;
    }
    customParseURL(skey, sdefault) {
        var queryString = window.location.search;
        var urlParams = new URLSearchParams(queryString);
        let param = urlParams.get(skey);
        return (param ? param : sdefault);
    }
    isMessage(message) {
        switch (message.MediaType) {
            case "open":
            case "webmessaging":
            case "whatsapp":
            case "facebook":
            case "sms":
            case "instagram":
            case "twitter":
                return true;
            default: return false;
        }
    }
    checkSapType(mediaType) {
        switch (mediaType) {
            case "voice": return "CALL";
            case "chat":
            case "email":
            case "open":
            case "webmessaging":
                return "CHAT";
            case "facebook":
            case "whatsapp":
            case "sms":
            case "instagram":
            case "twitter":
                return ctiType == "agentDesktop" ? "MESSAGE" : "CHAT";
        }
    }
    checkGenesysType(message) {
        if (ctiType == "agentDesktop") {
            switch (message.MediaType) {
                case "chat":
                case "open":
                case "webmessaging":
                    return "CHAT";
                case "facebook":
                case "sms":
                case "instagram":
                case "whatsapp":
                case "twitter":
                    return ctiType == "agentDesktop" ? "MESSAGE" : "CHAT";
            }
        }
    }
    checkDirection(message) {
        return message.CallType == 'Inbound' ? "INBOUND" : "OUTBOUND";
    }
    notify(message, id) {
        var payload = {
            Type: this.checkSapType(message.MediaType),
            EventType: this.checkDirection(message),
            Action: "NOTIFY",
            ...id
        };
        loggerSap.info("*** posting message : ", payload);
        parent.postMessage({ payload: payload }, "*");
    }
    accept(message, id) {
        var externalId = saputil.replaceAll(message.ConnectionID, "-", "");
        if (this.isMessage(message)) {
            externalId = Date.now().toString();
            iwscommand.SetAttachdataById(message.InteractionID, { message_id: externalId });
        }
        var payload = {
            Type: this.checkSapType(message.MediaType),
            Action: "ACCEPT",
            EventType: this.checkDirection(message),
            ExternalReferenceID: externalId,
            ...id
        };
        if (message.attachdata && message.attachdata.activity_uuid && ctiType != "agentDesktop") {
            payload.EventType = "UPDATEACTIVITY";
            payload.ActivityUUID = message.attachdata.activity_uuid;
            delete payload.Action;
        }
        loggerSap.info("*** posting message : ", payload);
        parent.postMessage({ payload: payload }, "*");
    }
    end(message) {
        var payload = {
            Type: this.checkSapType(message.MediaType),
            EventType: "UPDATEACTIVITY",
            ExternalReferenceID: saputil.replaceAll(message.InteractionID, "-", ""),
            Action: "END"
        };
        if (message.Service == 'PureCloud' && message.MediaType == 'voice') {
            payload.RecordingId = "REC_GENESYS_RECORDING";
        }
        loggerSap.info("*** posting message : ", payload);
        parent.postMessage({ payload: payload }, "*");
    }
    getTranscript(message) {
        switch (message.MediaType) {
            case "chat":
                iwscommand.getTranscriptPEF(message.InteractionID, "EventGetTranscriptPEF");
                break;
            case "open":
            case "webmessaging":
            case "whatsapp":
            case "facebook":
            case "sms":
            case "instagram":
            case "twitter":
                iwscommand.getMessageTranscriptPEF(message.InteractionID, "EventGetTranscriptPEF");
                break;
        }
    }
    push(message, id) {
        var payload = {
            Type: "NOTIFICATION",
            EventType: "PUSH",
            Action: "NOTIFY",
            ...id
        };
        loggerSap.info("*** posting message : ", payload);
        parent.postMessage({ payload: payload }, "*");
    }
}
const saputil = new SAPUtil();
