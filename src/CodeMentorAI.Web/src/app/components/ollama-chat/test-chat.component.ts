import { Component } from '@angular/core';

@Component({
  selector: 'app-test-chat',
  standalone: true,
  template: `
    <div style="
      background: #ff0000; 
      color: white; 
      padding: 40px; 
      margin: 20px; 
      border-radius: 12px; 
      border: 5px solid #ff0000;
      text-align: center;
      font-size: 18px;
      min-height: 300px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    ">
      <h1 style="font-size: 32px; margin-bottom: 20px;">🎉 TEST CHAT COMPONENT WORKING!</h1>
      <p style="font-size: 20px; margin: 10px 0;">✅ Component loads successfully</p>
      <p style="font-size: 20px; margin: 10px 0;">✅ Route is functional</p>
      <p style="font-size: 20px; margin: 10px 0;">✅ Template renders correctly</p>
      <p style="font-size: 20px; margin: 10px 0;">🔴 This red banner should be VERY visible</p>
      <p style="font-size: 16px; margin: 20px 0; font-style: italic;">This is a fresh test component with zero dependencies</p>
      <div style="background: white; color: red; padding: 10px; border-radius: 8px; margin-top: 20px;">
        <strong>SUCCESS: Ollama Chat Route is Working!</strong>
      </div>
    </div>
  `
})
export class TestChatComponent {
  constructor() {
    console.log('🎯 TestChatComponent constructor called - component is loading!');
  }
}
