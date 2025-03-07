import { useRef, useState, useEffect } from "react";
import "./VerifyPassResetCode.scss";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../Redux/app/hooks";
import { BASE_URL, FORGOT_PASSWORD, VERIFY_RESET_CODE } from "../../../Api/Api";
import axios from "axios";
import {
  clearData,
  saveResetCode,
} from "../../../Redux/feature/resetDataPassSlice/resetDataPassSlice";
import Loading from "../../../components/Loading/Loading";
import { useTranslation } from "react-i18next";

function VerifyPassResetCode() {
  const [code, setCode] = useState<string[]>(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState<number>(60);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const [errors, setErrors] = useState<{ msg: string; path?: string }[]>([]);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const { lang } = useAppSelector((state) => state.language);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { email, resetCode } = useAppSelector((state) => state.resetDataPass);

  useEffect(() => {
    if (!email || resetCode) {
      dispatch(clearData());
      navigate(`/${lang}/forgot-password`, { replace: true });
      return;
    }
  }, []);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  useEffect(() => {
    if (isSubmitted) {
      validateForm();
    }
  }, [code]);

  const validateForm = () => {
    const enteredCode = code.join("");
    const newErrors: { msg: string; path?: string }[] = [];

    if (enteredCode.length !== 6) {
      newErrors.push({ msg: "Reset code must be 6 digits", path: "resetCode" });
    }

    if (newErrors.length !== 0) {
      setLoading(false);
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? `0${secs}` : secs}`;
  };

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Backspace" && !code[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pastedData = event.clipboardData.getData("text").trim();

    if (/^\d{6}$/.test(pastedData)) {
      const newCode = pastedData.split("");
      setCode(newCode);

      newCode.forEach((val: string, i: number) => {
        if (inputsRef.current[i]) inputsRef.current[i]!.value = val;
      });

      inputsRef.current[5]?.focus();
    }
  };

  const handleResendCode = async () => {
    try {
      const res = await axios.post(`${BASE_URL}${FORGOT_PASSWORD}`, { email });
      if (res.status === 200) {
        console.log(res.data);
        setTimer(120);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors([]);
    setIsSubmitted(true);
    if (!validateForm()) return;
    const enteredCode = code.join("");
    if (enteredCode.length === 6) {
      try {
        const res = await axios.post(`${BASE_URL}${VERIFY_RESET_CODE}`, {
          resetCode: enteredCode,
        });
        if (res.status === 200) {
          console.log(res.data);
          setLoading(false);
          dispatch(saveResetCode(enteredCode));
          navigate(`/${lang}/reset-password`, { replace: true });
        }
      } catch (err) {
        setLoading(false);
        if (axios.isAxiosError(err) && err.response) {
          if (err.response.data?.message) {
            setErrors([{ msg: err.response.data.message }]);
          } else if (err.response.data?.errors) {
            setErrors(
              err.response.data.errors.map(
                (error: { msg: string; path: string }) => ({
                  msg: error.msg,
                  path: error.path,
                })
              )
            );
          }
        } else {
          setErrors([
            { msg: "An unexpected error occurred. Please try again later." },
          ]);
        }
      }
    }
  };

  return (
    <>
      {loading && <Loading transparent={true} />}
      <div className="verify-reset-code">
        <div className="verify-reset-code-box">
          <h2>{t("verifyPassResetCode.title")}</h2>
          <p>{t("verifyPassResetCode.instruction")}</p>
          <form onSubmit={handleSubmit}>
            <div className="inputs">
              <div className="inputs-box">
                {code.map((_, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      inputsRef.current[index] = el;
                    }}
                    type="text"
                    maxLength={1}
                    value={code[index]}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    className="w-12 h-12 text-center text-xl border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ))}
              </div>
              {errors.some(
                (error) => error.path === "resetCode" && isSubmitted
              ) && (
                <p className="error-text">
                  <span className="error-star">*</span>{" "}
                  {errors.find((error) => error.path === "resetCode")?.msg}
                </p>
              )}
            </div>

            {errors.some((error) => !error.path && isSubmitted) && (
              <div className="error-box">
                {errors
                  .filter((error) => !error.path)
                  .map((error, index) => (
                    <p key={index} className="error-text">
                      <span className="error-star">*</span> {error.msg}
                    </p>
                  ))}
              </div>
            )}

            <button type="submit" className="submit-btn">
              {t("verifyPassResetCode.sendButton")}
            </button>

            <p className="resend-code">
              {timer > 0 ? (
                <span className="display-timer">
                  {t("verifyPassResetCode.displayTimer")} {formatTime(timer)}
                </span>
              ) : (
                <button onClick={handleResendCode} className="resend-code-btn">
                  {t("verifyPassResetCode.resendCodeButton")}
                </button>
              )}
            </p>
          </form>
        </div>
      </div>
    </>
  );
}

export default VerifyPassResetCode;
