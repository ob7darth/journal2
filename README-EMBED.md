# Life Journal Daily Devotions - Embed Guide

## Quick Embed Code

For the simplest integration, use this basic iframe code:

```html
<iframe 
    src="https://your-deployed-app.netlify.app" 
    width="100%" 
    height="800px"
    frameborder="0"
    style="border-radius: 8px; max-width: 100%;"
    allowfullscreen>
</iframe>
```

## WordPress Integration

### Method 1: HTML Block (Gutenberg Editor)
1. Add an "HTML" block to your page/post
2. Paste the embed code above
3. Update the `src` URL to your deployed app URL
4. Publish your page

### Method 2: Custom HTML Widget
1. Go to Appearance → Widgets
2. Add a "Custom HTML" widget
3. Paste the embed code
4. Save

### Method 3: Shortcode (Advanced)
Add this to your theme's `functions.php`:

```php
function life_journal_shortcode($atts) {
    $atts = shortcode_atts(array(
        'width' => '100%',
        'height' => '800px',
        'url' => 'https://your-deployed-app.netlify.app'
    ), $atts);
    
    return '<div class="life-journal-embed">
        <iframe 
            src="' . esc_url($atts['url']) . '" 
            width="' . esc_attr($atts['width']) . '" 
            height="' . esc_attr($atts['height']) . '"
            frameborder="0"
            style="border-radius: 8px; max-width: 100%;"
            allowfullscreen>
        </iframe>
    </div>';
}
add_shortcode('life_journal', 'life_journal_shortcode');
```

Then use: `[life_journal]` or `[life_journal height="600px"]`

## Divi Integration

### Method 1: Code Module
1. Add a "Code" module to your page
2. Paste the embed code in the "Code" field
3. Update the `src` URL
4. Save and publish

### Method 2: Text Module with HTML
1. Add a "Text" module
2. Switch to the "Text" tab (not Visual)
3. Paste the embed code
4. Save and publish

## Responsive Design

For optimal mobile experience, use this enhanced code:

```html
<div class="life-journal-container">
    <iframe 
        src="https://your-deployed-app.netlify.app" 
        width="100%" 
        height="800px"
        frameborder="0"
        allowfullscreen
        class="life-journal-iframe">
    </iframe>
</div>

<style>
.life-journal-container {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.life-journal-iframe {
    width: 100%;
    height: 800px;
    border: none;
    display: block;
}

@media (max-width: 768px) {
    .life-journal-iframe {
        height: 100vh;
        min-height: 600px;
    }
}

@media (max-width: 480px) {
    .life-journal-container {
        border-radius: 0;
        margin: 0 -20px;
    }
    
    .life-journal-iframe {
        height: calc(100vh - 60px);
    }
}
</style>
```

## Advanced Customization

### Custom Styling
```css
.life-journal-embed {
    background: #f8fafc;
    padding: 20px;
    border-radius: 16px;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.life-journal-embed iframe {
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    transition: box-shadow 0.3s ease;
}

.life-journal-embed iframe:hover {
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}
```

### Loading Placeholder
```html
<div class="life-journal-loading" id="lifeJournalLoading">
    <div class="loading-content">
        <div class="loading-spinner"></div>
        <h3>Loading Life Journal Daily Devotions...</h3>
        <p>Preparing your spiritual journey</p>
    </div>
</div>

<iframe 
    src="https://your-deployed-app.netlify.app" 
    width="100%" 
    height="800px"
    frameborder="0"
    allowfullscreen
    onload="document.getElementById('lifeJournalLoading').style.display='none';"
    style="border-radius: 8px;">
</iframe>

<style>
.life-journal-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 800px;
    background: linear-gradient(135deg, #fefdf8 0%, #fefbf0 100%);
    border-radius: 8px;
    text-align: center;
}

.loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #e2e8f0;
    border-top: 4px solid #0284c7;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 20px;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
</style>
```

## Security Considerations

### Content Security Policy (CSP)
If your site uses CSP, add these directives:

```
frame-src https://your-deployed-app.netlify.app;
script-src 'unsafe-inline';
style-src 'unsafe-inline';
```

### Sandbox Attributes (Optional)
For additional security:

```html
<iframe 
    src="https://your-deployed-app.netlify.app"
    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
    width="100%" 
    height="800px">
</iframe>
```

## Testing Your Embed

1. **Local Testing**: Test on a local HTML file first
2. **Mobile Testing**: Check on various mobile devices
3. **Browser Testing**: Test in Chrome, Firefox, Safari, Edge
4. **Performance**: Monitor loading times
5. **Accessibility**: Ensure keyboard navigation works

## Troubleshooting

### Common Issues

**Iframe not loading:**
- Check the `src` URL is correct and accessible
- Verify HTTPS if your site uses HTTPS
- Check for CSP restrictions

**Height issues:**
- Use `min-height` for responsive designs
- Consider `100vh` for full-screen experience
- Test on different screen sizes

**Mobile problems:**
- Ensure viewport meta tag: `<meta name="viewport" content="width=device-width, initial-scale=1.0">`
- Use responsive CSS
- Test touch interactions

### Support

For technical support with embedding:
- Email: amyhisaoka@enewhope.org
- Include: Your website URL, embed code used, and description of the issue

## Examples

### Simple Blog Post Embed
```html
<div style="margin: 40px 0; text-align: center;">
    <h3>Try Our Daily Devotional</h3>
    <iframe 
        src="https://your-deployed-app.netlify.app" 
        width="100%" 
        height="600px"
        style="border: 1px solid #e5e7eb; border-radius: 8px; max-width: 800px;">
    </iframe>
</div>
```

### Sidebar Widget
```html
<div class="widget life-journal-widget">
    <h4>Daily Devotions</h4>
    <iframe 
        src="https://your-deployed-app.netlify.app" 
        width="100%" 
        height="400px"
        style="border: none; border-radius: 6px;">
    </iframe>
</div>
```

### Full Page Integration
```html
<!DOCTYPE html>
<html>
<head>
    <title>Daily Devotions</title>
    <style>
        body { margin: 0; padding: 0; }
        .devotions-container { height: 100vh; }
    </style>
</head>
<body>
    <div class="devotions-container">
        <iframe 
            src="https://your-deployed-app.netlify.app" 
            width="100%" 
            height="100%"
            frameborder="0">
        </iframe>
    </div>
</body>
</html>
```