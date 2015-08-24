/*
 *  Simple HTTP get webclient test
 */

#include <ESP8266WiFi.h>

const int BUTTON_PIN = 12;

const char* ssid     = "WIFI_SSID_HERE";
const char* password = "WIFI_PASSWORD_HERE";

// Just the hostname, no protocal
const char* host = "";


bool isButtonReset = false;
void setup() {
  pinMode(BUTTON_PIN, INPUT);
  digitalWrite(BUTTON_PIN, LOW);
  isButtonReset = digitalRead(BUTTON_PIN);

  Serial.begin(115200);

  Serial.println(millis());
  Serial.print("\n isButtonReset: ");
  Serial.println(isButtonReset);

  delay(10);
  if (isButtonReset) {
    // do the damn thing
    connectToWiFi();
    doLog();
  }

  Serial.println(millis());

  digitalWrite(BUTTON_PIN, LOW);
  delay(1000);

  goToSleep();

}


void doLog() {
  Serial.print("connecting to ");
  Serial.println(host);

  // Use WiFiClient class to create TCP connections
  WiFiClient client;
  const int httpPort = 80;
  if (!client.connect(host, httpPort)) {
    Serial.println("connection failed");
    return;
  }

  // We now create a URI for the request
  String url = "/log/12";
  Serial.print("Requesting URL: ");
  Serial.println(url);

  // This will send the request to the server
  client.print(String("POST ") + url + " HTTP/1.1\r\n" +
               "Host: " + host + "\r\n" +
               "Connection: close\r\n\r\n");
  delay(10);

  // Read all the lines of the reply from server and print them to Serial
  while(client.connected()){
    String line = client.readStringUntil('\r');
    Serial.print(line);
  }

  Serial.println();
  Serial.println("closing connection");
  delay(100);
  client.stop();
  delay(100);
}

void connectToWiFi() {

  // We start by connecting to a WiFi network

  Serial.println();
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
}

void goToSleep() {
  Serial.println("going to sleep!");
  ESP.deepSleep(0, WAKE_RF_DEFAULT);
  delay(1000);
}

void loop() {
}

