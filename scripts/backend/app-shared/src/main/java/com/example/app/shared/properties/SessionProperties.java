package com.example.app.shared.properties;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties (prefix = "app.session")
public class SessionProperties extends CacheProperties
{

}
