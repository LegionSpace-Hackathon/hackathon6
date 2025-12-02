package com.payegis.cloud.vigil.utils;

import lombok.extern.slf4j.Slf4j;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;
import org.xml.sax.SAXException;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import java.io.File;
import java.io.IOException;

@Slf4j
public class Parser {
    private Document doc = null;
    private DocumentBuilder dbBuilder;
    private DocumentBuilderFactory dbFactory = DocumentBuilderFactory.newInstance();
    private String miconPath = null;


    private NodeList getNodelist(String manifestPath) {
        NodeList manifests = null;
        try {
            dbBuilder = dbFactory.newDocumentBuilder();
            doc = dbBuilder.parse(new File(manifestPath));
            manifests = doc.getElementsByTagName("manifest");
        } catch (SAXException | ParserConfigurationException | IOException e) {
            log.error("Get NodeList from AndroidManifest.xml occurred Exception!", e);
        }
        return manifests;
    }

    public Parser(String manifestPath) {
        NodeList manifests = getNodelist(manifestPath);
        if (manifests != null) {
            NodeList applications;
            for (int i = 0; i < manifests.getLength(); i++) {
                Element manifestElement = (Element) manifests.item(i);
                applications = manifestElement.getElementsByTagName("application");
                for (int j = 0; j < applications.getLength(); j++) {
                    Element applicationElement = (Element) applications.item(j);
                    this.miconPath = applicationElement.getAttribute("android:icon");
                }
            }
        }
    }
    public String getMiconpath(){return this.miconPath;}
}
