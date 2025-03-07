//VERSION 3.2.0
var softphone_connector_initialized = false;
function networkError(message) {
    log.error(message);
}
function onConnectedSession(message) {
    if (softphone_connector_initialized == true) {
        return;
    }
    saputil.updateConnectionLed("led-yellow", "Connection in standby ...");
}
function onDisconnectedSession(message) {
    $("#led").removeClass();
    $("#led").addClass("led-red");
    $(".led-msg p").text("Session disconnected");
    softphone_connector_initialized = false;
}
function onActivateSession(message) {
    loggerSap.info("onActivateSession ", message);
    if (softphone_connector_initialized == true) {
        return;
    }
    window.addEventListener("message", saputil.receiveMessage);
    saputil.updateConnectionLed("led-green", "");
    softphone_connector_initialized = true;
}
function onActivatePureEmbeddableSessionFullPEF(message) {
    loggerSap.info("onActivatePureEmbeddableSessionFullPEF ", message);
    if (softphone_connector_initialized == true) {
        return;
    }
    window.addEventListener("message", saputil.receiveMessage);
    softphone_connector_initialized = true;
}
//==================================================================
// VOICE INBOUND
//==================================================================
function onEventRingingInbound(message) {
    loggerSap.info("onEventRingingInbound : ", message);
    saputil.notify(message, {
        ANI: saputil.buildANI(message.ANI)
    });
}
function onEventEstablishedInbound(message) {
    loggerSap.info("onEventEstablishedInbound : ", message);
    saputil.accept(message, {
        ANI: saputil.buildANI(message.ANI),
        Custom_1: message.ConnectionID,
        Custom_2: message.MediaType
    });
    /*
     var payload:SapPayload = {
         ANI: saputil.buildANI(message.ANI),
         Type: "CALL",
         EventType: "INBOUND",
         Action : "ACCEPT",
         ExternalReferenceID : saputil.replaceAll(message.ConnectionID,"-",""),
         Custom_1: message.ConnectionID,
         Custom_2: message.MediaType
     };
     loggerSap.info("*** posting message : ", payload);
     parent.postMessage({ payload: payload }, "*");
     */
}
function onEventReleasedInbound(message) {
    loggerSap.info("onEventReleasedInbound : ", message);
    saputil.end(message);
}
//==================================================================
// VOICE OUTBOUND
//==================================================================
function onEventRingingOutbound(message) {
    loggerSap.info("onEventRingingOutbound : ", message);
    let phone = message.DNIS;
    if (message.SourceMsg.isDialer && !message.SourceMsg.isDialerPreview) {
        phone = message.ANI;
    }
    saputil.notify(message, {
        ANI: saputil.buildANI(phone)
    });
}
function onEventEstablishedOutbound(message) {
    loggerSap.info("onEventEstablishedOutbound : ", message);
    let phone = message.DNIS;
    if (message.SourceMsg.isDialer && !message.SourceMsg.isDialerPreview) {
        phone = message.ANI;
    }
    saputil.accept(message, {
        ANI: saputil.buildANI(phone),
        Custom_1: message.ConnectionID,
        Custom_2: message.MediaType
    });
}
function onEventReleasedOutbound(message) {
    loggerSap.info("onEventReleasedOutbound : ", message);
    saputil.end(message);
}
//==================================================================
// EMAIL
//==================================================================
function onEmailEventRingingInbound(message) {
    loggerSap.info("onEmailEventRingingInbound : ", message);
    if (message.attachdata.SAP_ID) {
        return;
    }
    saputil.notify(message, {
        Email: message.attachdata['context.email'] || message.EmailAddress || message.attachdata.EmailAddress || message.ANI,
        Name: message.attachdata['context.firstName'] || '',
        ChatType: "text"
    });
}
function onEmailEventEstablishedInbound(message) {
    loggerSap.info("onEmailEventEstablishedInbound : ", message);
    if (message.attachdata.sap_id) {
        saputil.push(message, {
            ThingType: "COD_EMAIL",
            ObjectUUID: message.attachdata.sap_id
        });
    }
    else {
        saputil.accept(message, {
            Email: message.attachdata['context.email'] || message.EmailAddress || message.attachdata.EmailAddress || message.ANI,
            Name: message.attachdata['context.firstName'] || '',
            ChatType: "text",
            Custom_1: message.ConnectionID,
            Custom_2: message.MediaType
        });
    }
}
function onEmailEventReleasedInbound(message) {
    loggerSap.info("onEmailEventReleasedInbound : ", message);
    saputil.end(message);
}
//==================================================================
//CHAT
//==================================================================
function onChatEventRingingInbound(message) {
    loggerSap.info("onChatEventRingingInbound : ", message);
    saputil.notify(message, {
        Email: message.attachdata['context.email'] || message.EmailAddress || message.attachdata.EmailAddress
    });
}
function onChatEventEstablishedInbound(message) {
    loggerSap.info("onChatEventEstablishedInbound : ", message);
    saputil.accept(message, {
        Email: message.attachdata['context.email'] || message.EmailAddress || message.attachdata.EmailAddress,
        Custom_1: message.ConnectionID,
        Custom_2: message.MediaType
    });
}
function onChatEventReleasedInbound(message) {
    loggerSap.info("onChatEventReleasedInbound : ", message);
    saputil.getTranscript(message);
}
async function onEventGetTranscriptPEF(message) {
    loggerSap.info("onEventGetTranscriptPEF : ", message);
    saputil.manageTranscript(message);
}
//==================================================================
// SMS
//==================================================================
function onSmsEventRingingInbound(message) {
    loggerSap.info("onSmsEventRingingInbound : ", message);
    saputil.notify(message, {
        ANI: saputil.buildANI(message.ANI),
        ChannelId: message.MediaType,
        Custom_1: message.ConnectionID,
        Custom_2: message.MediaType
    });
}
function onSmsEventEstablishedInbound(message) {
    loggerSap.info("onSmsEventEstablishedInbound : ", message);
    saputil.accept(message, {
        ANI: saputil.buildANI(message.ANI),
        ChannelId: message.MediaType,
        Custom_1: message.ConnectionID,
        Custom_2: message.MediaType
    });
}
function onSmsEventReleasedInbound(message) {
    loggerSap.info("onSmsEventReleasedInbound : ", message);
    saputil.getTranscript(message);
}
//==================================================================
// WHATSAPP
//==================================================================
function onWhatsappEventRingingInbound(message) {
    loggerSap.info("onWhatsappEventRingingInbound : ", message);
    saputil.notify(message, {
        ANI: saputil.buildANI(message.ANI),
        ChannelId: message.MediaType,
        Custom_1: message.ConnectionID,
        Custom_2: message.MediaType
    });
}
function onWhatsappEventEstablishedInbound(message) {
    loggerSap.info("onWhatsappEventEstablishedInbound : ", message);
    saputil.accept(message, {
        ANI: saputil.buildANI(message.ANI),
        ChannelId: message.MediaType,
        Custom_1: message.ConnectionID,
        Custom_2: message.MediaType
    });
}
function onWhatsappEventReleasedInbound(message) {
    loggerSap.info("onWhatsappEventReleasedInbound : ", message);
    saputil.getTranscript(message);
}
//==================================================================
// FACEBOOK
//==================================================================
function onFacebookEventRingingInbound(message) {
    loggerSap.info("onFacebookEventRinging : ", message);
    saputil.notify(message, {
        ANI: saputil.buildANI(message.ANI),
        ChannelId: message.MediaType,
        Custom_1: message.ConnectionID,
        Custom_2: message.MediaType
    });
}
function onFacebookEventEstablishedInbound(message) {
    loggerSap.info("onFacebookEventEstablished : ", message);
    saputil.accept(message, {
        ANI: saputil.buildANI(message.ANI),
        ChannelId: message.MediaType,
        Custom_1: message.ConnectionID,
        Custom_2: message.MediaType
    });
}
function onFacebookEventReleasedInbound(message) {
    loggerSap.info("onFacebookEventReleased : ", message);
    saputil.getTranscript(message);
}
//==================================================================
// WEBMESSAGING
//==================================================================
function onWebmessagingEventRingingInbound(message) {
    loggerSap.info("onWebmessagingEventRinging : ", message);
    saputil.notify(message, {
        Email: message.attachdata['context.email'] || message.EmailAddress || message.attachdata.EmailAddress,
        Custom_1: message.ConnectionID,
        Custom_2: message.MediaType
    });
}
function onWebmessagingEventEstablishedInbound(message) {
    loggerSap.info("onWebmessagingEventEstablished : ", message);
    saputil.accept(message, {
        Email: message.attachdata['context.email'] || message.EmailAddress || message.attachdata.EmailAddress,
        Custom_1: message.ConnectionID,
        Custom_2: message.MediaType
    });
}
function onWebmessagingEventReleasedInbound(message) {
    loggerSap.info("onWebmessagingEventReleased : ", message);
    saputil.getTranscript(message);
}
function onSwitchInteractionPEF(message) {
    loggerSap.info("onSwitchInteractionPEF : ", message);
    iwscore.selectInteractionOption(message.InteractionID);
}
