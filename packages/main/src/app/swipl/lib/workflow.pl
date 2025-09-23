:- module(workflow, [
    produces/2,       % ?Output, ?Step
    edge/2,           % ?Producer, ?Consumer
    edges/1,          % -Edges
    build_graph/1,    % -Graph
    refresh/0,        % 
    refresh/1,        % -Graph
    plan/2,           % +Target, -ResultTerm
    plan_dict/2,      % +Target, -ResultDict
    plan_all/2,       % +Targets, -ResultTerm
    plan_all_dict/2   % +Targets, -ResultDict
]).

:- use_module(library(ugraphs)).
:- use_module(library(lists)).

:- dynamic workflow_graph/1.

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%% API 文档
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

%!  produces(+Output, -Step) is nondet.
%
%   查询某个输出产物由哪个步骤生成。
%
%   ```
%   ?- produces(parsed_tree, S).
%   S = parse_text.
%   ```

%!  edge(-Producer, -Consumer) is nondet.
%
%   构建依赖边。如果 Producer 的输出正好是 Consumer 的输入，
%   则存在边 Producer -> Consumer。

%!  edges(-Edges:list) is det.
%
%   收集所有依赖边，形式为 From-To 的列表。

%!  build_graph(-Graph) is det.
%
%   基于当前事实 (step/3, available/1) 构造工作流图。
%   Graph 是一个 ugraph 结构。
%
%   注意: build_graph/1 每次都是即时快照，不更新缓存。

%!  refresh is det.
%!  refresh(-Graph) is det.
%
%   刷新缓存的工作流图。实际会调用 build_graph/1，
%   然后更新内部的动态谓词 workflow_graph/1。
%
%   - refresh/0 : 刷新缓存，不返回图。
%   - refresh/1 : 刷新缓存，同时返回最新的图。

%!  plan(+Target, -Result:term) is det.
%
%   为单个目标产物构造执行计划 (Term 风格)。
%   Result = result(PlanSteps, MissingInputs)。
%
%   - PlanSteps    = 拓扑有序的步骤列表。
%   - MissingInputs= 阻塞执行的输入列表。
%
%   示例:
%   ```
%   ?- plan(report, R).
%   R = result([parse_text, extract_entities, make_report], []).
%   ```

%!  plan_dict(+Target, -Result:dict) is det.
%
%   为单个目标产物构造执行计划 (Dict 风格)。
%   Result = result{plan:Steps, missing:Missing}。
%
%   示例:
%   ```
%   ?- plan_dict(report, R).
%   R = result{plan:[parse_text, extract_entities, make_report], missing:[]}.
%   ```

%!  plan_all(+Targets:list, -Result:term) is det.
%
%   为多个目标产物构造合并执行计划 (Term 风格)。
%   所有目标的依赖步骤去重，并保证拓扑有序。
%
%   Result = result(PlanSteps, MissingInputs)。
%
%   示例:
%   ```
%   ?- plan_all([report, entities], R).
%   R = result([parse_text, extract_entities, make_report], []).
%   ```

%!  plan_all_dict(+Targets:list, -Result:dict) is det.
%
%   为多个目标产物构造合并执行计划 (Dict 风格)。
%   Result = result{plan:Steps, missing:Missing}。
%
%   示例:
%   ```
%   ?- plan_all_dict([report, entities], R).
%   R = result{plan:[parse_text, extract_entities, make_report], missing:[]}.
%   ```
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%% 使用说明
%%
%% 1. 用户定义事实：
%%      step(StepName, Inputs, Outputs).
%%      available(Input).
%%
%% 2. 示例：
%%      step(parse_text, [raw_text], [parsed_tree]).
%%      step(extract_entities, [parsed_tree], [entities]).
%%      available(raw_text).
%%
%% 3. 刷新缓存：
%%      ?- refresh.
%%      ?- refresh(G).   % G 获取最新构建的图
%%
%%   每次修改 step/3 或 available/1 后，必须 refresh。
%%
%% 4. 查询计划：
%%      // Term 风格 (推荐，可移植):
%%      ?- plan(report, R).
%%      R = result([parse_text, extract_entities, make_report], []).
%%
%%      ?- plan_all([report, entities], R).
%%      R = result([parse_text, extract_entities, make_report], []).
%%
%%      // Dict 风格 (SWI 专用):
%%      ?- plan_dict(report, R).
%%      R = result{plan:[parse_text, extract_entities, make_report], missing:[]}.
%%
%%      ?- plan_all_dict([report, entities], R).
%%      R = result{plan:[parse_text, extract_entities, make_report], missing:[]}.
%%
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%


%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%% 工具：依赖关系
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

produces(Output, Step) :-
    step(Step, _, Outputs),
    member(Output, Outputs).

edge(Producer, Consumer) :-
    step(Consumer, Inputs, _),
    member(Input, Inputs),
    produces(Input, Producer).

edges(Edges) :-
    findall(From-To, edge(From, To), Edges).

build_graph(Graph) :-
    findall(S, step(S, _, _), Steps),
    edges(Edges),
    vertices_edges_to_ugraph(Steps, Edges, Graph).

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%% 刷新缓存
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

refresh :-
    build_graph(Graph),
    retractall(workflow_graph(_)),
    asserta(workflow_graph(Graph)).

refresh(Graph) :-
    build_graph(Graph),
    retractall(workflow_graph(_)),
    asserta(workflow_graph(Graph)).

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%% 获取当前图（缓存优先）
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

current_graph(Graph) :-
    ( workflow_graph(Graph) ->
        true
    ; build_graph(Graph)
    ).

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%% plan/2 : 单目标 Term 风格
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

plan(Target, result(OrderedPlan, Missing)) :-
    build_plan(Target, Steps, Missings),
    list_to_set(Steps, NeededSet),
    sort(Missings, Missing),
    (   Missing = []
    ->  current_graph(Graph),
        top_sort(Graph, Order),
        include({NeededSet}/[Step]>>memberchk(Step, NeededSet), Order, OrderedPlan)
    ;   OrderedPlan = []
    ).

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%% plan_dict/2 : 单目标 Dict 包装
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

plan_dict(Target, result{plan:Plan, missing:Missing}) :-
    plan(Target, result(Plan, Missing)).

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%% plan_all/2 : 多目标 Term 风格
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

plan_all(Targets, result(OrderedPlan, Missing)) :-
    current_graph(Graph),
    top_sort(Graph, Order),
    collect_plan_results(Targets, Results),
    flatten_union(Results, AllSteps, AllMissing),
    list_to_set(AllSteps, NeededSet),
    sort(AllMissing, Missing),
    (   Missing = []
    ->  include({NeededSet}/[Step]>>memberchk(Step, NeededSet), Order, OrderedPlan)
    ;   OrderedPlan = []
    ).

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%% plan_all_dict/2 : 多目标 Dict 包装
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

plan_all_dict(Targets, result{plan:Plan, missing:Missing}) :-
    plan_all(Targets, result(Plan, Missing)).

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%% 内部工具
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

collect_plan_results([], []).
collect_plan_results([T|Ts], [Steps-Missing|Rest]) :-
    build_plan(T, Steps, Missing),
    collect_plan_results(Ts, Rest).

flatten_union([], [], []).
flatten_union([Steps-Miss|Rest], AllSteps, AllMissing) :-
    flatten_union(Rest, S1, M1),
    append(Steps, S1, AllSteps),
    append(Miss, M1, AllMissing).

build_plan(Target, [], []) :-
    available(Target), !.
build_plan(Target, Steps, Missing) :-
    produces(Target, Step),
    step(Step, Inputs, _),
    build_inputs(Inputs, SubSteps, SubMissing),
    (   SubMissing = []
    ->  append(SubSteps, [Step], Steps),
        Missing = []
    ;   Steps = SubSteps,
        Missing = SubMissing
    ).

build_inputs([], [], []).
build_inputs([I|Is], Steps, Missing) :-
    build_plan(I, S1, M1),
    build_inputs(Is, S2, M2),
    append(S1, S2, Steps),
    append(M1, M2, Missing).