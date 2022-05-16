import {
  ActionPanel,
  Action,
  Form,
  useNavigation,
  showToast,
  Toast,
  popToRoot,
  confirmAlert,
  getPreferenceValues,
  Detail,
  Icon,
} from "@raycast/api";

import fs from "fs";
import { languages, vsCodePath, vsCodeInsidersPath } from "../data";
import Search from "./Search";

interface Values {
  prefix: string;
  body: string;
  description: string;
  language: string[];
  title: string;
  vscode: string;
  vscodeInsiders: string;
}
interface Preferences {
  vscode: boolean;
  vscodeInsiders: boolean;
}
const Editor = (props?: Item & { title?: string; type?: "vscode" | "vscode-insiders" }) => {
  const preferences: Preferences = getPreferenceValues();

  const { push } = useNavigation();
  const postData = async (
    v: { prefix: string; body: string; description: string; language: string[]; title: string },
    path: string
  ) => {
    const data = {
      prefix: v.prefix,
      body: v.body.split("\n"),
      description: v.description,
      scope: v.language.join(),
    };
    if (fs.existsSync(path)) {
      const obj = JSON.parse(fs.readFileSync(path).toString());
      if (props && props.title) {
        obj[props.title] = data;
      } else {
        if (obj[v.title]) {
          if (
            await confirmAlert({
              title: "Override?",
              message: "Are you sure you want to override this item?",
            })
          ) {
            obj[v.title] = data;
          } else {
            console.log("cancel");
          }
        } else {
          obj[v.title] = data;
        }
      }
      fs.writeFileSync(path, JSON.stringify(obj));
    } else {
      fs.writeFileSync(
        path,
        JSON.stringify({
          [v.title]: data,
        })
      );
    }
  };

  return (
    <>
      {!preferences.vscode && !preferences.vscodeInsiders ? (
        <Detail
          markdown={`
## Please set preferences`}
        />
      ) : (
        <Form
          actions={
            <ActionPanel>
              <Action.SubmitForm
                icon={Icon.Plus}
                onSubmit={async (v: Values) => {
                  if (v.title === "" || v.prefix === "" || v.body === "") {
                    showToast({
                      title: "Error",
                      message: "title, prefix and body are required",
                      style: Toast.Style.Failure,
                    });
                  } else {
                    //環境変数でvscodeのみチェックが入っていた場合
                    if (preferences.vscode && !preferences.vscodeInsiders) {
                      await postData(v, vsCodePath);
                    }
                    //環境変数でvscode-insidersのみチェックが入っていた場合
                    else if (!preferences.vscode && preferences.vscodeInsiders) {
                      await postData(v, vsCodeInsidersPath);
                    }
                    //環境変数で両方にチェックが入っていた場合
                    else if (preferences.vscode && preferences.vscodeInsiders) {
                      if (v.vscode) {
                        await postData(v, vsCodePath);
                      }
                      if (v.vscodeInsiders) {
                        await postData(v, vsCodeInsidersPath);
                      }
                    }
                    push(<Search />);
                  }
                }}
              ></Action.SubmitForm>
              <Action
                icon={Icon.ArrowClockwise}
                title="Back"
                onAction={() => {
                  popToRoot();
                }}
                shortcut={{ modifiers: [], key: "escape" }}
              ></Action>
            </ActionPanel>
          }
        >
          {preferences.vscode && preferences.vscodeInsiders && (
            <>
              <Form.Checkbox label="vscode" id="vscode" defaultValue={props?.type === "vscode" && true} />
              <Form.Checkbox
                label="vscodeInsiders"
                id="vscodeInsiders"
                defaultValue={props?.type === "vscode-insiders" && true}
              />
            </>
          )}

          <Form.TagPicker id="language" title="language" defaultValue={props?.scope}>
            {languages.map((language) => {
              return <Form.TagPicker.Item key={language} title={language} value={language}></Form.TagPicker.Item>;
            })}
          </Form.TagPicker>
          <Form.TextField id="title" title="title" defaultValue={props?.title}></Form.TextField>
          <Form.TextField id="prefix" title="prefix" defaultValue={props?.prefix}></Form.TextField>
          <Form.TextField id="description" title="description" defaultValue={props?.description}></Form.TextField>
          <Form.TextArea id="body" title="body" defaultValue={props?.body}></Form.TextArea>
        </Form>
      )}
    </>
  );
};
export default Editor;
