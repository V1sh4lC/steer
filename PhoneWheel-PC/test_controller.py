
# import json
# import websocket
# import vgamepad as vg

# BRIDGE_URL = "ws://127.0.0.1:8082"

# gamepad = vg.VX360Gamepad()


# def on_open(ws):
#     print("Connected to PhoneWheel server!")
#     print("Waiting for live phone steering... 🏎️")


# def on_message(ws, message):
#     try:
#         data = json.loads(message)
#         steering = float(data["steering"])
#         steering = max(-100.0, min(100.0, steering))

#         # Convert -100..100% to the Xbox stick's -32768..32767 range.
#         x_value = round(steering / 100.0 * 32767)

#         gamepad.left_joystick(x_value=x_value, y_value=0)
#         gamepad.update()

#         print(
#             f"\rSteering: {steering:6.1f}% | "
#             f"Virtual stick X: {x_value:6d}   ",
#             end="",
#             flush=True,
#         )

#     except (ValueError, KeyError, TypeError, json.JSONDecodeError) as error:
#         print(f"\nInvalid steering message: {error}")


# def on_error(ws, error):
#     print(f"\nWebSocket error: {error}")


# def on_close(ws, code, message):
#     gamepad.left_joystick(x_value=0, y_value=0)
#     gamepad.update()
#     print("\nDisconnected. Steering centered.")


# try:
#     ws = websocket.WebSocketApp(
#         BRIDGE_URL,
#         on_open=on_open,
#         on_message=on_message,
#         on_error=on_error,
#         on_close=on_close,
#     )
#     ws.run_forever()

# except KeyboardInterrupt:
#     print("\nStopping controller test...")

# finally:
#     gamepad.left_joystick(x_value=0, y_value=0)
#     gamepad.update()


import json
import websocket
import vgamepad as vg

BRIDGE_URL = "ws://127.0.0.1:8082"

gamepad = vg.VX360Gamepad()


def clamp(value, minimum, maximum):
    return max(minimum, min(maximum, value))


def on_open(ws):
    print("Connected to PhoneWheel server! 🎮")
    print("Waiting for steering, acceleration and braking... 🏎️")


def on_message(ws, message):
    try:
        data = json.loads(message)

        # Read and validate incoming controls.
        steering = clamp(float(data["steering"]), -100.0, 100.0)
        throttle = clamp(float(data.get("throttle", 0)), 0.0, 100.0)
        brake = clamp(float(data.get("brake", 0)), 0.0, 100.0)

        # Map steering percentage to the Xbox left stick.
        x_value = round(steering / 100.0 * 32767)

        # Map pedal percentages to Xbox trigger values (0–255).
        rt_value = round(throttle / 100.0 * 255)
        lt_value = round(brake / 100.0 * 255)

        gamepad.left_joystick(x_value=x_value, y_value=0)
        gamepad.right_trigger(value=rt_value)
        gamepad.left_trigger(value=lt_value)
        gamepad.update()

        print(
            f"\rSteer: {steering:6.1f}% | "
            f"Accel: {throttle:5.1f}% | "
            f"Brake: {brake:5.1f}%   ",
            end="",
            flush=True,
        )

    except (ValueError, KeyError, TypeError, json.JSONDecodeError) as error:
        print(f"\nInvalid control message: {error}")


def reset_controls():
    gamepad.left_joystick(x_value=0, y_value=0)
    gamepad.right_trigger(value=0)
    gamepad.left_trigger(value=0)
    gamepad.update()


def on_error(ws, error):
    print(f"\nWebSocket error: {error}")


def on_close(ws, code, message):
    reset_controls()
    print("\nDisconnected. All controls reset.")


try:
    ws = websocket.WebSocketApp(
        BRIDGE_URL,
        on_open=on_open,
        on_message=on_message,
        on_error=on_error,
        on_close=on_close,
    )
    ws.run_forever()

except KeyboardInterrupt:
    print("\nStopping controller test...")

finally:
    reset_controls()
    print("Steering, throttle and brake reset.")
